import { arrayBufferToBase64, TFile } from "obsidian";
import { settings } from "./settings";

const context = "util";

function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
		// keep hash in 32-bit signed range
		hash |= 0;
	}
	const hue = ((hash % 360) + 360) % 360;
	return `hsl(${hue}, 70%, 50%)`;
}

export function debugLog(context: string, message: object | string) {
	if (settings.debug) {
		const color = stringToColor(context);

		console.log(
			`[AIImageAnalyzer] %c[${context}]`,
			`color: ${color}; font-weight: bold;`,
			message,
		);
	}
}

export function getTempBasePath(): string {
	// @ts-ignore
	return `${app.vault.configDir}/plugins/ai-image-analyzer/tmp`; //must be global app ref to be used externally
}

export function getTempPath(file: TFile): string {
	const folder = `${getTempBasePath()}`;
	const filename = `${file.path.replace(/\//g, "_")}`;
	return `${folder}/${filename}`;
}

export function isImageFile(file: TFile): boolean {
	const path = file.path;

	return (
		path.endsWith(".png") ||
		path.endsWith(".jpg") ||
		path.endsWith(".jpeg") ||
		path.endsWith(".webp") ||
		path.endsWith(".svg")
	);
}

export enum ImageType {
	Unknown,
	Png,
	Jpg,
	Jpeg,
	Webp,
	Svg
}

export function getImageType(file: TFile): ImageType {
	const ext = file.extension.toLowerCase();

	const map: Record<string, ImageType> = {
		png: ImageType.Png,
		jpg: ImageType.Jpg,
		jpeg: ImageType.Jpeg,
		webp: ImageType.Webp,
		svg: ImageType.Svg
	};

	return map[ext] ?? ImageType.Unknown;
}

export async function fileToBase64String(file: TFile): Promise<string> {
	// @ts-ignore
	return arrayBufferToBase64(await app.vault.readBinary(file)); //must be global app ref to be used externally
}

export async function svgFileToBase64String(file: TFile): Promise<string> {
	if (!file.path.toLowerCase().endsWith(".svg")) {
		throw new Error("Please input svg file.");
	}

	debugLog(context, "Converting SVG to PNG");

	try {
		const svgData: string = await this.app.vault.adapter.read(file.path);

		return await new Promise<string>((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const size = 1000;
			canvas.width = size;
			canvas.height = size;

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}

			const img = new Image();

			const blob = new Blob([svgData], {
				type: "image/svg+xml;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);

			img.onload = () => {
				try {
					URL.revokeObjectURL(url);

					ctx.fillStyle = "#ffffff";
					ctx.fillRect(0, 0, size, size);

					ctx.drawImage(img, 0, 0, size, size);

					const dataUrl = canvas.toDataURL("image/png");
					resolve(dataUrl.split(",")[1]); // 只返回 base64
				} catch (err) {
					reject(err);
				}
			};

			img.onerror = (err) => {
				URL.revokeObjectURL(url);
				console.error("Error loading SVG image:", err);
				reject(err);
			};

			img.src = url;
		});
	} catch (error) {
		console.error("Error converting SVG to PNG:", error);
		throw error;
	}
}

export async function webpFileToBase64String(file: TFile): Promise<string> {
	if (!file.path.toLowerCase().endsWith(".webp")) {
		throw new Error("Please input webp file.");
	}

	debugLog(context, "Converting WEBP to PNG");

	try {
		const binary = await this.app.vault.readBinary(file);
		const blob = new Blob([binary], { type: "image/webp" });

		return await new Promise<string>((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");

			if (!context) {
				reject(new Error("Could not get canvas context"));
				return;
			}

			const image = new Image();
			const url = URL.createObjectURL(blob);

			image.onload = () => {
				try {
					canvas.width = image.width;
					canvas.height = image.height;

					context.drawImage(image, 0, 0);
					const dataUrl = canvas.toDataURL("image/png");

					URL.revokeObjectURL(url);

					resolve(dataUrl.split(",")[1]);
				} catch (err) {
					URL.revokeObjectURL(url);
					reject(err);
				}
			};

			image.onerror = (error) => {
				URL.revokeObjectURL(url);
				reject(error);
			};

			image.src = url;
		});
	} catch (error) {
		console.error("Error converting WEBP to PNG:", error);
		throw error;
	}
}

export function htmlDescription(innerHTML: string): DocumentFragment {
	const desc = new DocumentFragment();
	desc.createSpan({}, (span) => {
		span.innerHTML = innerHTML;
	});
	return desc;
}
