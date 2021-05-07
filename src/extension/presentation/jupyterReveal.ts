import { commands, OutputChannel, Uri, notebook, workspace, window } from 'vscode';
import { spawn } from 'child_process';
import { IDisposable } from '../types';
import { disposeAllDisposables, registerDisposable } from '../utils';
import * as path from 'path';
import * as fs from 'fs-extra';

export class JupyterNotebookSlides implements IDisposable {
    private readonly disposables: IDisposable[] = [];
    constructor(private readonly outputChannel: OutputChannel) {
        this.disposables.push(
            commands.registerCommand('jupyter.notebook.toJupyterSlides', this.onGenerateSlides, this)
        );
    }
    public static register(outputChannel: OutputChannel) {
        registerDisposable(new JupyterNotebookSlides(outputChannel));
    }
    public dispose() {
        disposeAllDisposables(this.disposables);
    }

    private async onGenerateSlides(uri: Uri) {
        uri = uri || window.activeNotebookEditor?.document.uri;
        if (!uri) {
            return;
        }
        const htmlFile = await this.generateSlides(uri);
        if (htmlFile) {
            commands.executeCommand('jupyter.previewSlides', htmlFile);
        }
    }
    private async saveNotebookIfRequired(uri: Uri): Promise<Uri> {
        const document = notebook.notebookDocuments.find((item) => item.uri.toString() === uri.toString());
        if (!document) {
            throw new Error('Notebook not found');
        }
        if (document.isDirty && window.activeNotebookEditor?.document === document) {
            await commands.executeCommand('workbench.action.files.save');
        }
        if (document.isUntitled) {
            window.showErrorMessage('Please save the untitled notebook to a file before generating a slide');
        }
        return uri;
    }
    private async generateSlides(uri: Uri) {
        uri = await this.saveNotebookIfRequired(uri);
        if (!uri.fsPath.toLowerCase().endsWith('.ipynb')) {
            return;
        }
        const generationCmd = workspace.getConfiguration('jupyter').get<string>('nbConvertToSlidesCommand');
        const command = `${generationCmd} '${uri.fsPath.replace(/\\/g, '/')}'`;
        const expectedHtmlFile = `${uri.fsPath.substring(0, uri.fsPath.length - 6)}.slides.html`;
        try {
            const proc = spawn(command, { cwd: path.dirname(uri.fsPath), env: process.env, shell: true });
            proc.stdout.on('data', (data) => this.outputChannel.append(data.toString()));
            proc.stderr.on('data', (data) => this.outputChannel.append(data.toString()));
            await new Promise((resolve) => proc.once('exit', resolve));
        } catch {
            // Noop.
        }
        if (!fs.pathExists(expectedHtmlFile)) {
            throw new Error('HTML File not generated');
        }
        return Uri.file(expectedHtmlFile);
    }
}
