import { ExtensionContext, window } from 'vscode';
import { JupyterNotebookSlides } from './presentation/jupyterReveal';
import { JupyterRevealViewer } from './presentation/jupyterRevealPreview';

export async function activate(context: ExtensionContext) {
    const outputChannel = window.createOutputChannel('Jupyter Powertools');
    context.subscriptions.push(outputChannel);
    JupyterNotebookSlides.register(outputChannel);
    JupyterRevealViewer.register();
}

export async function deactivate(): Promise<void> {}
