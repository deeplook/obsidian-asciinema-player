import { Plugin } from 'obsidian';
import * as AsciinemaPlayer from 'asciinema-player';
import 'asciinema-player/dist/bundle/asciinema-player.css';

export default class AsciinemaPlayerPlugin extends Plugin {
  onload() {
    this.registerMarkdownCodeBlockProcessor('asciinema', (source, el, ctx) => {
      const lines = source.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        return;
      }

      const castPath = lines[0].trim();
      const opts: Record<string, string | number | boolean> = {};

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
            // Try to parse value as a number
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
        // It's a URL, use it directly after trimming the prefix
        const url = castPath.substring(urlPrefix.length).trim();
        const player = AsciinemaPlayer.create(url, playerContainer, opts);
        if (opts.loop) {
          player.addEventListener('ended', () => player.play());
        }
      } else {
        // It's a local file, resolve it through Obsidian's vault
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          return;
        }
        const castFile = this.app.metadataCache.getFirstLinkpathDest(castPath, activeFile.path);

        if (castFile) {
          const resourcePath = this.app.vault.adapter.getResourcePath(castFile.path);
          const player = AsciinemaPlayer.create(resourcePath, playerContainer, opts);
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
}
