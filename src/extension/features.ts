import { ConfigurationTarget, workspace } from 'vscode';

export class FeatureManager {
    public static async hideCellSlidesFromStatusbar() {
        await workspace
            .getConfiguration('jupyter')
            .update('showCellSlidesStatusbar', false, ConfigurationTarget.Global);
    }
}
