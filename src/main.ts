import { FileView, MarkdownRenderChild, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import * as AsciinemaPlayer from 'asciinema-player';
import 'asciinema-player/dist/bundle/asciinema-player.css';

const VIEW_TYPE_ASCIINEMA = 'asciinema-cast';
const CAST_EXTENSION = '.cast';

interface AsciinemaPlayerInstance {
  dispose(): void;
  play(): void;
  addEventListener(event: string, listener: () => void): void;
}

type PlayerOptions = Record<string, string | number | boolean>;

interface CastEmbedCtx {
  containerEl: HTMLElement;
  app: {
    vault: {
      getResourcePath(file: TFile): string;
    };
  };
}

interface CastEmbedRegistry {
  isExtensionRegistered?(extension: string): boolean;
  registerExtension(
    extension: string,
    creator: (ctx: CastEmbedCtx, file: TFile, subpath: string) => AsciinemaEmbed,
  ): void;
  unregisterExtension?(extension: string): void;
}

function createPlayer(src: string, el: HTMLElement, opts: PlayerOptions): AsciinemaPlayerInstance {
  // Live preview selects the block on click unless the target sits in this class.
  el.addClass('interactive-child');
  return AsciinemaPlayer.create(src, el, opts);
}

function playbackOptions(fit: 'width' | 'both', controls: boolean): PlayerOptions {
  return {
    autoplay: true,
    loop: true,
    controls,
    fit,
  };
}

function castEmbedRegistry(app: Plugin['app']): CastEmbedRegistry | null {
  const registry = (app as Plugin['app'] & { embedRegistry?: CastEmbedRegistry }).embedRegistry;
  if (!registry || typeof registry.registerExtension !== 'function') {
    return null;
  }
  return registry;
}

function castLinkpath(src: string): string | null {
  const path = src.split('#')[0].split('|')[0].trim();
  if (!path.toLowerCase().endsWith(CAST_EXTENSION)) {
    return null;
  }
  return path;
}

function replaceEmbed(embed: HTMLElement): HTMLElement {
  const host = embed.doc.createElement('div');
  host.addClass('asciinema-player-embed');
  if (embed.style.width) {
    host.style.width = embed.style.width;
  }
  if (embed.style.height) {
    host.style.height = embed.style.height;
  }
  embed.replaceWith(host);
  return host;
}

class AsciinemaEmbed extends MarkdownRenderChild {
  private player: AsciinemaPlayerInstance | null = null;

  constructor(containerEl: HTMLElement, private readonly src: string) {
    super(containerEl);
  }

  onload(): void {
    this.mount();
  }

  // The embed registry calls this after onload. Mount again only if that did not run.
  loadFile(): void {
    if (!this.player) {
      this.mount();
    }
  }

  onunload(): void {
    this.destroyPlayer();
  }

  private mount(): void {
    this.destroyPlayer();
    this.player = createPlayer(this.src, this.containerEl, playbackOptions('width', true));
  }

  private destroyPlayer(): void {
    const player = this.player;
    this.player = null;
    player?.dispose();
  }
}

class AsciinemaCastView extends FileView {
  private player: AsciinemaPlayerInstance | null = null;

  getViewType(): string {
    return VIEW_TYPE_ASCIINEMA;
  }

  getDisplayText(): string {
    return this.file?.basename ?? 'Asciinema';
  }

  getIcon(): string {
    return 'play';
  }

  canAcceptExtension(extension: string): boolean {
    return extension === 'cast';
  }

  async onLoadFile(file: TFile): Promise<void> {
    await super.onLoadFile(file);
    this.mount(file);
  }

  async onUnloadFile(file: TFile): Promise<void> {
    this.destroyPlayer();
    this.contentEl.empty();
    await super.onUnloadFile(file);
  }

  protected async onClose(): Promise<void> {
    this.destroyPlayer();
    await super.onClose();
  }

  private mount(file: TFile): void {
    this.destroyPlayer();
    this.contentEl.empty();
    const frame = this.contentEl.createDiv({ cls: 'asciinema-player-view-frame' });
    this.player = createPlayer(this.app.vault.getResourcePath(file), frame, playbackOptions('both', true));
  }

  private destroyPlayer(): void {
    const player = this.player;
    this.player = null;
    player?.dispose();
  }
}

export default class AsciinemaPlayerPlugin extends Plugin {
  onload() {
    this.registerView(VIEW_TYPE_ASCIINEMA, (leaf: WorkspaceLeaf) => new AsciinemaCastView(leaf));
    try {
      this.registerExtensions(['cast'], VIEW_TYPE_ASCIINEMA);
    } catch (err) {
      console.error('asciinema-player: failed to register .cast files', err);
    }
    this.registerCastEmbeds();

    this.registerMarkdownPostProcessor((el, ctx) => {
      const embeds: HTMLElement[] = [];
      if (el.hasClass('internal-embed')) {
        embeds.push(el);
      }
      for (const node of el.findAll('.internal-embed')) {
        embeds.push(node);
      }

      for (const embed of embeds) {
        if (embed.hasClass('asciinema-player-embed')) {
          continue;
        }
        const src = embed.getAttr('src');
        if (!src) {
          continue;
        }
        const linkpath = castLinkpath(src);
        if (!linkpath) {
          continue;
        }

        const host = embed === el ? embed : replaceEmbed(embed);
        host.addClass('asciinema-player-embed');
        host.addClass('is-loaded');
        host.empty();

        const file = this.app.metadataCache.getFirstLinkpathDest(linkpath, ctx.sourcePath);
        if (!(file instanceof TFile)) {
          const errorDiv = host.createDiv({ cls: 'asciinema-player-file-not-found' });
          errorDiv.createSpan({ text: `asciinema-player: ${linkpath} not found` });
          continue;
        }

        const frame = host.createDiv({ cls: 'asciinema-player-frame' });
        ctx.addChild(new AsciinemaEmbed(frame, this.app.vault.getResourcePath(file)));
      }
    });

    this.registerMarkdownCodeBlockProcessor('asciinema', (source, el) => {
      const lines = source.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        return;
      }

      const castPath = lines[0].trim();
      const opts: PlayerOptions = {};

      for (let i = 1; i < lines.length; i++) {
        const match = lines[i].match(/^\s*(\w+):\s*(.*)\s*$/);
        if (match) {
          const key = match[1];
          const value = match[2];

          if (value === 'true') {
            opts[key] = key === 'loop' ? 1 : true;
          } else if (value === 'false') {
            opts[key] = false;
          } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              opts[key] = numValue;
            } else {
              opts[key] = value;
            }
          }
        }
      }

      const playerContainer = el.createDiv();
      const urlPrefix = 'src:';

      if (castPath.startsWith(urlPrefix)) {
        const url = castPath.substring(urlPrefix.length).trim();
        const player = createPlayer(url, playerContainer, opts);
        if (opts.loop) {
          player.addEventListener('ended', () => player.play());
        }
      } else {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          return;
        }
        const castFile = this.app.metadataCache.getFirstLinkpathDest(castPath, activeFile.path);

        if (castFile) {
          const resourcePath = this.app.vault.getResourcePath(castFile);
          const player = createPlayer(resourcePath, playerContainer, opts);
          if (opts.loop) {
            player.addEventListener('ended', () => player.play());
          }
        } else {
          const errorDiv = playerContainer.createDiv({
            cls: 'asciinema-player-file-not-found',
          });
          errorDiv.createSpan({
            text: `asciinema-player: ${castPath} not found`,
          });
        }
      }
    });
  }

  onunload() {
    try {
      castEmbedRegistry(this.app)?.unregisterExtension?.('cast');
    } catch (err) {
      console.error('asciinema-player: failed to unregister cast embeds', err);
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_ASCIINEMA);
  }

  private registerCastEmbeds(): void {
    const registry = castEmbedRegistry(this.app);
    if (!registry) {
      return;
    }
    try {
      if (registry.isExtensionRegistered?.('cast')) {
        return;
      }
      registry.registerExtension('cast', (ctx, file) => {
        ctx.containerEl.addClass('asciinema-player-embed');
        ctx.containerEl.addClass('interactive-child');
        const frame = ctx.containerEl.createDiv({ cls: 'asciinema-player-frame' });
        return new AsciinemaEmbed(frame, ctx.app.vault.getResourcePath(file));
      });
    } catch (err) {
      console.error('asciinema-player: failed to register cast embeds', err);
    }
  }
}
