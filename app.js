import { LAW_DATA, GROUP_ORDER, FIBCO_FIELD_IDS } from "./data.js";
import { initThemeControls } from "./theme.js";
import { initUI } from "./ui.js";

initUI({
  lawData: LAW_DATA,
  groupOrder: GROUP_ORDER,
  fibcoFieldIds: FIBCO_FIELD_IDS
});

initThemeControls();
