const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
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
	function getVaultName() {
		return vscode.workspace
			.getConfiguration("obsidian-code")
			.get("vaultName");
	}

	// debug
	console.log(`current vault: ${getVaultName()}`);

	let disposable = vscode.commands.registerCommand(
		"obsidian-code.openObsidian",
		function () {
			const { title } = getFileInfo();
			const vaultName = getVaultName();
			if (vaultName) {
				// 根据 vault 名和文件名构建 URI
				let obURI = `obsidian://open?vault=${vaultName}&file=${title}`;
				vscode.env.openExternal(vscode.Uri.parse(obURI));
				vscode.window.showInformationMessage(`opening file ${title}`);
			} else {
				vscode.window.showErrorMessage("please specify a vault name");
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
