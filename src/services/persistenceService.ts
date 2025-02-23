import { MoodTrackerEntry } from "src/entities/MoodTrackerEntry";
import MoodTrackerPlugin from "src/main";


export class PersistenceService {
    private get filepath(): string { 
        return this.plugin.settings.folderPath + '/' + this.plugin.dataFileName; 
    }

    constructor(private plugin: MoodTrackerPlugin) {
    }

    public async getEntries(): Promise<MoodTrackerEntry[] | undefined> {
        const adapter = this.plugin.app.vault.adapter;
        
        await this.createDataFileIfNotExists();

        try {
            const fileData = await adapter.read(this.filepath);
            if (!fileData) { 
                return new Array<MoodTrackerEntry>(); 
            }
            const data = JSON.parse(fileData) as MoodTrackerEntry[];
            data.forEach(entry => { 
                entry.dateTime = new Date(entry.dateTime); 
                entry.moodRating = Number(entry.moodRating);
            }); // parsing dates
            
            return data;
        } catch (error) {
            this.plugin.showNotice(`Ошибка при загрузке записей Mood Tracker из файла ${this.filepath}: ${error}`);
            console.warn(error);
        }
    }

    public async saveEntries(): Promise<void> {
        const adapter = this.plugin.app.vault.adapter;

        await this.createDataFileIfNotExists();

        try {
            // override toJSON so dates will be saved with preserved timezone 
            Date.prototype.toJSON = function(){ return window.moment(this).format(); }
            const entries = this.plugin.entries;
            const jsonData = JSON.stringify(entries, null, 2);
            await adapter.write(this.filepath, jsonData);
        } catch (error) {
            this.plugin.showNotice(`Ошибка при сохранении записей Mood Tracker в файл ${this.filepath}: ${error}`);
            console.warn(error);
        }
    }

    private async createDataFileIfNotExists(): Promise<void> {
        const adapter = this.plugin.app.vault.adapter;

        if (!await adapter.exists(this.plugin.settings.folderPath)) {
            this.plugin.showNotice(`Mood Tracker: директория "${this.plugin.settings.folderPath}" не найдена, создаю...`);
            await adapter.mkdir(this.plugin.settings.folderPath);
            this.plugin.showNotice(`Mood Tracker: создана директория "${this.plugin.settings.folderPath}". Вы можете изменить путь в настройках; а пока вам придётся перемещать mood-tracker-data.json вручную. Нажмите, чтобы закрыть`, 30000);
        }

        if (!await adapter.exists(this.filepath)) {
            this.plugin.showNotice(`По адресу "${this.filepath}" не найден файл данных трекера настроения. Создаю новый файл данных...`);
            await adapter.write(this.filepath, "[]");
        }
    }
}
