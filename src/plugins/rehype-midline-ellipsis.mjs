import { visit } from "unist-util-visit";

/**
 * ... -> ⋯ 변환 및 모든 상황에서의 간격 최적화
 */
export function rehypeMidlineEllipsis() {
	return (tree) => {
		visit(tree, "text", (node, _index, parent) => {
			if (
				!parent ||
				["pre", "code", "kbd", "script", "style"].includes(parent.tagName)
			)
				return;

			let value = node.value;
			if (!value.includes("...")) return;

			let modified = false;

			// 1. 글자 바로 뒤에 점이 오는 경우: '글자 ⋯'로 변환
			if (/(\S)\.{3,}/g.test(value)) {
				value = value.replace(/(\S)\.{3,}/g, "$1 ⋯");
				modified = true;
			}

			// 2. 이미 공백이 있거나 문장 시작인 경우: 그냥 '⋯'로 변환
			if (/\.{3,}/g.test(value)) {
				value = value.replace(/\.{3,}/g, "⋯");
				modified = true;
			}

			if (modified) {
				node.value = value;
			}
		});
	};
}
