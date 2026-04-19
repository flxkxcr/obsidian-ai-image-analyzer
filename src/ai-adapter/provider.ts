import { Models } from "./types";
import { TFile } from "obsidian";
import AIImageAnalyzerPlugin from "../main";

export abstract class Provider {
	lastModel: Models;
	lastImageModel: Models;

	abstract queryHandling(prompt: string): Promise<string>;
	abstract queryWithImageHandling(
		prompt: string,
		image: TFile,
	): Promise<string>;
	abstract generateSettings(
		containerEl: HTMLElement,
		plugin: AIImageAnalyzerPlugin,
	): void;

	shutdown(): void {
		// Optional shutdown logic for providers
	}

	setLastModel(model: Models) {
		this.lastModel = model;
	}

	setLastImageModel(model: Models) {
		this.lastImageModel = model;
	}
}
