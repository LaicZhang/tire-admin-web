/**
 * @see {@link https://element-plus.org/en-US/component/loading.html#directives}
 */
export interface Loading {
  load?: boolean;
  text?: string;
  svg?: string | import("vue").FunctionalComponent | Function;
  spinner?: string;
  svgViewBox?: string;
  background?: string;
}
