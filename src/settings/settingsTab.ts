import {
	App,
	ButtonComponent,
	debounce,
	PluginSettingTab,
	Setting,
	TFolder,
} from "obsidian";
import MoodTrackerPlugin from "src/main";
import { GenericTextSuggester } from "./folderSetting/fileSuggester";
import { EmotionGroup } from "src/entities/IEmotionGroup";
import { MoveDataModal } from "./folderSetting/moveDataModal";
import { EmotionGroupEditModal } from "./emotionGroup/emotionGroupEditModal";
import { EmotionGroupDeleteModal } from "./emotionGroup/emotionGroupDeleteModal";
import { MoodRatingLabelsEditModal } from "./moodRatingLabel/moodRatingLabelsEditModal";

export class MoodTrackerSettingsTab extends PluginSettingTab {
	constructor(private _plugin: MoodTrackerPlugin, app: App) {
		super(app, _plugin);
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();

		this.addTrackerModalTitleSetting();
		this.addFolderPathSetting();
		this.addChartColorSetting();
		this.addMoodRatingLabelsSetting();
		this.addAddToNoteSettings();
		if (this._plugin.settings.addToJournal) {
			this.addJournalPathSetting();
			this.addJournalLocation();
			this.addTemplateSetting();
		}
		
		this.addUseEmotionsSetting();
		if (this._plugin.settings.useEmotions) {
			this.addEmotionsSetting();
		}
	}

	private addTrackerModalTitleSetting() {
		const setting = new Setting(this.containerEl);

		setting.setName("Заголовок трекера")
		setting.setDesc("Заголовок для модального окна при отчёте об эмоциях");

		setting.addText((input) => {
			input.inputEl.style.width = "min(400px, 35vw)";
			input.setValue(this._plugin.settings.trackerModalTitle)
			.onChange(async (value) => {
				this._plugin.settings.trackerModalTitle = value;
				await this._plugin.saveSettings();
			});
		})
	}

	// by C.Houmann (https://github.com/chhoumann/quickadd)
	// TODO: try to implement better one, maybe look outside of obsidian plugins
	private addFolderPathSetting() {
		const setting = new Setting(this.containerEl);
		let path = this._plugin.settings.folderPath;

		setting.setName("Папка для хранения данных");
		setting.setDesc(
			"Путь к папке, в которой будут храниться данные Mood Tracker."
		);

		setting.addText((text) => {
			text.inputEl.style.width = "min(335px, 35vw)";
			text.setPlaceholder("data/")
				.setValue(this._plugin.settings.folderPath)
				.onChange(debounce(async (value) => {
					if (value === this._plugin.settings.folderPath) {
						return;
					}

					if (await this.app.vault.adapter.exists(value)) {
						text.inputEl.removeAttribute("style");
						text.inputEl.removeAttribute("title");
						path = value;
						return;
					}
					text.inputEl.style.border = "1px solid red";
					text.inputEl.title = "Папка не существует";
				}, 500, true));

			new GenericTextSuggester(
				app,
				text.inputEl,
				app.vault
					.getAllLoadedFiles()
					.filter((f) => f instanceof TFolder && f.path !== "/")
					.map((f) => f.path)
			);
		});

		setting.addButton((button) => {
			button.setButtonText("Применить")
			.onClick(async () => {
				new MoveDataModal(this.app, this._plugin, path).open();
			})
		})
	}

	private addAddToNoteSettings() {
		const setting = new Setting(this.containerEl);

		setting.setName("Добавьте информацию о настроении в заметку");
		setting.descEl.innerHTML = `Новые записи в Mood Tracker будут также добавляться в markdown-заметку<br>
		Это только для целей ведения журнала; основные данные по-прежнему хранятся в файле data.json`;

		setting.addToggle((input) => {
			input.setValue(this._plugin.settings.addToJournal)
			.onChange(async (value) => {
				this._plugin.settings.addToJournal = value;
				await this._plugin.saveSettings();
				this.display();
			});

		})
	}

	private addChartColorSetting() {
		const setting = new Setting(this.containerEl);

		setting.setName("Цвет диаграммы")
		setting.setDesc("Основной цвет для элементов графика (например, линии или столбца).");

		setting.addColorPicker((picker) => {
			picker.setValue(this._plugin.settings.chartColor ?? "#000")
			.onChange(async (value) => {
				this._plugin.settings.chartColor = value;
				await this._plugin.saveSettings();
			})
		})
	}

	private addMoodRatingLabelsSetting() {
		const setting = new Setting(this.containerEl);

		setting.setName("Эмодзи для оценки настроения")
		setting.setDesc("Эмодзи, используемые для оценки настроения. Используется в модальном окне и статистике.");

		setting.addButton((button) => {
			button.setButtonText("Изменить")
			.onClick(async () => {
				new MoodRatingLabelsEditModal(this._plugin, app).open();
			})
		})
	}

	private addJournalPathSetting() {
		const setting = new Setting(this.containerEl);

		setting.setName("Путь к заметке");
		setting.descEl.innerHTML = `Используйте статический путь к файлу или переменную {{DATE}}.(если это заметка, не забудьте указать .md в конце)<br>
		Поддерживается <a href="https://momentjs.com/docs/#/displaying/format/" target="_blank">форматирование moment.js</a>.<br>
		Пример: journals/daily/{{DATE:YYYY-MM-DD}}.md
		`

		setting.addText((input) => {
			input.inputEl.style.width = "min(400px, 35vw)";
			input.setValue(this._plugin.settings.journalFilePath)
			.onChange(async (value) => {
				this._plugin.settings.journalFilePath = value;
				await this._plugin.saveSettings();
			});

		})
	}

	private addJournalLocation() {
		const setting = new Setting(this.containerEl);

		setting.setName("Место входа");
		setting.descEl.innerHTML = `Где в заметке должна быть размещена запись Mood-Tracker?<br>
		Пример: ## Mood Tracker
		`

		setting.addText((input) => {
			input.inputEl.style.width = "min(400px, 35vw)";
			input.setValue(this._plugin.settings.journalPosition)
			.onChange(async (value) => {
				this._plugin.settings.journalPosition = value;
				await this._plugin.saveSettings();
			});

		})
	}

	private addTemplateSetting() {
		const setting = new Setting(this.containerEl);

		setting.setName("Шаблон для вставки записи Mood Tracker в заметку");
		setting.descEl.innerHTML = `Доступные переменные:<br>
		{{DATE}} - дата создания <br>
		{{TIME}} - время создания <br>
		{{ICON}} - значок настроения <br>
		{{NOTE}} - примечание <br>
		{{EMOTIONS}} - список эмоций, разделённых запятыми, если таковые имеются<br>
		`;

		setting.addText((input) => {
			input.inputEl.style.width = "min(400px, 35vw)";
			input.setValue(this._plugin.settings.entryTemplate)
			.onChange(async (value) => {
				this._plugin.settings.entryTemplate = value;
				await this._plugin.saveSettings();
			});

		})
	}



	private addUseEmotionsSetting() {
		const setting = new Setting(this.containerEl);

		setting.setName("Использованные эмоции")
		setting.setDesc("Отслеживайте более тонкие эмоции в дополнение к простой оценке настроения");

		setting.addToggle((input) => {
			input.setValue(this._plugin.settings.useEmotions)
			.onChange(async (value) => {
				this._plugin.settings.useEmotions = value;
				await this._plugin.saveSettings();
				this.display();
			});
		})
	}

	private addEmotionsSetting() {
		const settingGroupEl = this.containerEl.createEl("div");
		settingGroupEl.createEl("h4", { text: "Эмоции" });
		settingGroupEl.createEl("small", {
			text: "Список эмоций, разделённых запятыми или новыми строками. При необходимости можно определить одну или несколько групп эмоций, каждая из которых будет иметь свой цвет.",
		});

		for (const [
			index,
			emotionGroup,
		] of this._plugin.settings.emotionGroups.entries()) {
			const setting = new Setting(settingGroupEl);

			setting.setName(emotionGroup.name ?? `Группа эмоций ${index}`);

			// TODO: text color

			setting.addExtraButton(cb => {
				cb.setIcon('arrow-up')
				.setTooltip("Переместить элемент вверх")
				.setDisabled(index === 0)
				.onClick(() => {
					if (index > 0) {
						const temp = this._plugin.settings.emotionGroups[index - 1].sortOrder;
						this._plugin.settings.emotionGroups[index - 1].sortOrder = emotionGroup.sortOrder;
						emotionGroup.sortOrder = temp;
						this._plugin.saveSettings();
						this.display();
					}
				})
			});
	
			setting.addExtraButton(cb => {
				cb.setIcon('arrow-down')
				.setTooltip("Переместить элемент вниз")
				.setDisabled(index >= this._plugin.settings.emotionGroups.length - 1)
				.onClick(() => {
					if (index < this._plugin.settings.emotionGroups.length - 1) {
						const temp = this._plugin.settings.emotionGroups[index + 1].sortOrder;
						this._plugin.settings.emotionGroups[index + 1].sortOrder = emotionGroup.sortOrder;
						emotionGroup.sortOrder = temp;
						this._plugin.saveSettings();
						this.display();
					}
				})
			});

			setting.addExtraButton((cb) => {
				cb.setIcon("edit")
					.setTooltip("Изменить группу")
					.onClick(() => {
						const modal = new EmotionGroupEditModal(this._plugin, emotionGroup, this.app);
						modal.open();
						modal.onClose = () => {
							this.display();
						};
					});
			});

			setting.addExtraButton((cb) => {
				cb.setIcon("trash")
					.setTooltip("Удалить группу")
					.onClick(async () => {
						new EmotionGroupDeleteModal(
							this.app,
							this._plugin,
							this,
							emotionGroup,
						).open();
					});
			});

		}

		const addMoodSectionBtn = new ButtonComponent(settingGroupEl);
		addMoodSectionBtn.setButtonText("Добавить группу");
		addMoodSectionBtn.onClick(async () => {
			this._plugin.settings.emotionGroups.push(new EmotionGroup());
			await this._plugin.saveSettings();
			this.display();
		});
	}
}
