import type { Emitter } from "mitt";
import mitt from "mitt";

/** 全域公共事件需要在此處添加類型 */
type Events = {
  openPanel: string;
  tagOnClick: string;
  logoChange: boolean;
  tagViewsChange: string;
  changLayoutRoute: string;
  tagViewsShowModel: string;
};

export const emitter: Emitter<Events> = mitt<Events>();
