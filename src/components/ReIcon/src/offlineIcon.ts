// 这里存放本地圖標，在 src/layout/index.vue 文件中載入，避免在首啟動載入
import { getSvgInfo } from "@pureadmin/utils";
import { addIcon } from "@iconify/vue/dist/offline";

// https://icon-sets.iconify.design/ep/?keyword=ep
import EpHomeFilled from "~icons/ep/home-filled?raw";

// https://icon-sets.iconify.design/ri/?keyword=ri
import RiSearchLine from "~icons/ri/search-line?raw";
import RiInformationLine from "~icons/ri/information-line?raw";

const icons = [
  // Element Plus Icon: https://github.com/element-plus/element-plus-icons
  ["ep/home-filled", EpHomeFilled],
  // Remix Icon: https://github.com/Remix-Design/RemixIcon
  ["ri/search-line", RiSearchLine],
  ["ri/information-line", RiInformationLine]
];

// 本地選單圖標，後端在路由的 icon 中返回對應的圖標字符串並且前端在此處使用 addIcon 添加即可渲染選單圖標
icons.forEach(([name, icon]) => {
  addIcon(name as string, getSvgInfo(icon as string));
});
