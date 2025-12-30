import { visit } from "unist-util-visit";

/**
 * 따옴표를 찾아 CSS로 제어 가능한 구조로 변환함.
 */
export function rehypeStylizedQuote() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (["pre", "code", "a", "kbd", "script", "style"].includes(node.tagName))
				return;

			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				if (child.type !== "text") continue;

				const value = child.value;
				const regex = /["“]([^"“”]+?)["”]|['‘]([^'‘’]+?)['’]/g;
				let lastIndex = 0;
				const newChildren = [];
				let match = regex.exec(value);

				while (match !== null) {
					if (match.index > lastIndex) {
						newChildren.push({
							type: "text",
							value: value.slice(lastIndex, match.index),
						});
					}

					const isDouble = match[1] !== undefined;
					const content = isDouble ? match[1] : match[2];
					const className = isDouble ? "quote-double" : "quote-single";

					newChildren.push({
						type: "element",
						tagName: "span",
						properties: { className: [className, "stylized-quote"] },
						children: [{ type: "text", value: content }],
					});

					lastIndex = regex.lastIndex;
					match = regex.exec(value);
				}

				if (lastIndex < value.length) {
					newChildren.push({ type: "text", value: value.slice(lastIndex) });
				}

				if (newChildren.length > 0) {
					node.children.splice(i, 1, ...newChildren);
					i += newChildren.length - 1;
				}
			}
		});
	};
}
