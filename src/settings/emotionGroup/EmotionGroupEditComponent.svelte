<script lang="ts">
	import { EmotionGroup } from "src/entities/IEmotionGroup";
	import MoodTrackerPlugin from "src/main";
	import store from "src/store";

	export let emotionGroup: EmotionGroup;
	export let closeModalFunc: () => void;

	let plugin: MoodTrackerPlugin;

	store.plugin.subscribe((p) => {
		plugin = p;
	});

	function onEmotionsChange(event: any) {
		emotionGroup.emotions = event.target.value.split(/[\n,]/g);
	}

	function save() {
		plugin.emotionService.saveEmotionsGroup(emotionGroup);
		closeModalFunc();
	}
</script>

<div class="edit-modal">
	<div class="edit-modal-section">
		<label for="nameInput">Название группы</label>
		<input id="nameInput" type="text" bind:value={emotionGroup.name} />
	</div>
	<div class="edit-modal-section">
		<label for="colorInput">Фоновый цвет</label>
		<input id="colorInput" type="color" bind:value={emotionGroup.color} />
	</div>
	<div class="edit-modal-section">
		<label for="emotionsInput">Эмоции (через запятую или новую строку)</label
		>
		<textarea id="emotionsInput" value={emotionGroup.emotions.join("\n")} on:change={onEmotionsChange} />
	</div>
	<div>
		<button on:click={save}>Сохранить</button>
	</div>
</div>

<style>
.edit-modal {
    height: 100%;
	min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.edit-modal-section {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
}
#emotionsInput {
	min-height: 120px;
}
</style>
