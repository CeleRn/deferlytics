import { installGlobalApi } from "../runtime/init";
import { getBrowserWindow } from "../core/utils";

const win = getBrowserWindow();
const api = installGlobalApi();

if (win?.__fastAnalyticsConfig) {
  api.init(win.__fastAnalyticsConfig);
}
