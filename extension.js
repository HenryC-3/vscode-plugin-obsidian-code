const vscode = require("vscode");
const fs = require("fs");


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const isWindows = "win32" === process.platform;

	// Code borrowed from https://github.com/wraith13/open-in-github-desktop-vscode/blob/master/source/extension.ts
	const fileExists = path => new Promise (
		resolve => fs.exists(
			path,
			exists => resolve(exists)
		)
	);
	const normalizePath = path => path.replace(isWindows ? /\\$/: /\/$/, "");
	const isRootDir = path => isWindows ?
        /^\w+\:$/.test(normalizePath(path)) ||
        /^\\\\[^\\]+\\[^\\]+$/.test(normalizePath(path))
    : "" === normalizePath(path);
	const getParentDir = path => normalizePath(path).replace(isWindows ? /\\[^\\]+$/: /\/[^\/]+$/, "");

	const searchObsidianConfig = async path =>
	{
		const obsConfigPath = `${path}/.obsidian`;
		if (await fileExists(obsConfigPath)) {
			return path;
		}
		if (!isRootDir(path)) {
			return await searchObsidianConfig(getParentDir(path));
		}
		return null;
	};


	/**
	 * @description 获取当前编辑器中文件的绝对路径以及文件标题
	 */
	function getFileInfo() {
		const path = vscode.window.activeTextEditor.document.uri.path;
		// 获取标题，以 .md 结束，以 / 开始
		const re = /\/([^\/]+)(.md)$/;
		re.test(path);
		const title = RegExp.$1;
		return {
			path,
			title,
		};
	}

	/**
	 * @description 获取 vault 名
	 */
	async function getVaultName(path) {
		const obsConfigPath = await searchObsidianConfig(getParentDir(path), true);
		if (obsConfigPath) {
			return obsConfigPath.replace(isWindows ? /.*\\([^\\]+)\\?/ : /.*\/([^\/]+)\/?/, '$1');
		} 

		return vscode.workspace
			.getConfiguration("obsidian-code")
			.get("vaultName");
	}

	// debug
	console.log(`obsidian-code: default vault: ${getVaultName()}`);

	let disposable = vscode.commands.registerCommand(
		"obsidian-code.openObsidian",
		async function () {
			// Check if a text editor is active
			if (!vscode.window.activeTextEditor) {
				console.error("obsidian-code: no text editor is active.");
				return;
			}
			// Check if the file has been deleted recently
			const scheme = vscode.window.activeTextEditor.document.uri.scheme;
			if (scheme !== "file") {
				vscode.window.showErrorMessage("Cannot find file. Has it been deleted?");
				return;
			}

			const { path, title } = getFileInfo();
			const vaultName = await getVaultName(path);
			if (vaultName) {
				// 根据 vault 名和文件名构建 URI
				let obURI = `obsidian://open?vault=${vaultName}&file=${title}`;
				vscode.env.openExternal(vscode.Uri.parse(obURI));
				vscode.window.showInformationMessage(`Opening file ${title} in Obsidian`);
			} else {
				vscode.window.showErrorMessage("Please set a default vault name in the extension settings");
			}
		}
	);

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
