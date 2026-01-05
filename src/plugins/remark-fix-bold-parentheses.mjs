import { visit } from "unist-util-visit";

/**
 * 괄호가 포함된 강조 구문을 파서가 인식하지 못할 때,
 * 텍스트 노드를 직접 분리하여 strong(강조) 노드로 변환함.
 */
export function remarkFixBoldParentheses() {
	return (tree) => {
		visit(tree, "text", (node, index, parent) => {
			if (!parent || index === undefined) return;

			// **내용(내용)** 패턴 탐색 (ZWSP 등 특수문자 대응 포함)
			const regex = /\*\*([^*]+?\([^)]+?\))\*\*/g;
			const value = node.value;
			const children = [];
			let lastIndex = 0;
			let match;

			while ((match = regex.exec(value)) !== null) {
				if (match.index > lastIndex) {
					children.push({
						type: "text",
						value: value.slice(lastIndex, match.index),
					});
				}

				children.push({
					type: "strong",
					children: [{ type: "text", value: match[1] }],
				});

				lastIndex = regex.lastIndex;
			}

			if (lastIndex < value.length) {
				children.push({
					type: "text",
					value: value.slice(lastIndex),
				});
			}

			if (children.length > 0) {
				parent.children.splice(index, 1, ...children);
				return index + children.length;
			}
		});
	};
}
