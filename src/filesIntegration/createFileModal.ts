import { App } from "obsidian";
import { ConfirmationModal } from "src/common/confirmationModal";

export class CreateFileModal extends ConfirmationModal {
	constructor(app: App, path: string, content: string) {
		super(app, "Файл не найден", () => this.createFile(path, content));
    this.setContent(`Файл по пути "${path}" отсутствует.\nХотите создать его?`)
	}

    async createFile(path: string, content: string): Promise<void> {
        const { vault } = this.app;
    
        const directoryPath = path.substring(0, path.lastIndexOf("/"));

        if (directoryPath != "" && !vault.getFolderByPath(directoryPath)) {
          await vault.createFolder(directoryPath);
        }
    
        await vault.create(path, content);
        this.close();
      }
}
