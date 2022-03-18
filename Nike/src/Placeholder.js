import { BlockContextProvider, useBlockEditContext } from '@wordpress/block-editor';
import BlockListItem from "./BlockList";

// block-editor/src/components/inner-blocks/index.js
const Placeholder = ({ className, orderIndex, clientId, highlight }) => {
  const context = useBlockEditContext();

  return (
    <BlockContextProvider value={context}>
      <div className={highlight ? "reserved-block" : null}>
        <BlockListItem rootClientId={clientId} orderIndex={orderIndex} className={className}/>
      </div>
    </BlockContextProvider>
  );
};

// packages/block-serialization-spec-parser/grammar.pegjs
const tagRegx = /<!--[ \t\r\n]+(?<void>wp:[a-z0-9\-\/]+)[ \t\r\n]+.*\/-->|<!--[ \t\r\n]+(?<begin>wp:[a-z0-9\-\/]+)[ \t\r\n]+.*-->|<!--[ \t\r\n]+\/(?<end>wp:[a-z0-9\-\/]+)[ \t\r\n]+-->|/g;

Placeholder.getChildren = (content) => {
  let childrenContent = content.props.children || '';

  const iterator = childrenContent.matchAll(tagRegx);

  let stack = 0;
  let begin = 0;
  let end = 0;

  const children = [];
  while (true) {
    const { value } = iterator.next()
    if (!value) {
      break;
    } else {
      if (value.groups.end) { // end tag
        end = value.index + value[0].length;
        stack -= 1;
      } else if (value.groups.void) { // void tag
        end = value.index + value[0].length;
      } else if (value.groups.begin) { // begin tag
        stack += 1;
      }

      if (stack === 0 && end !== begin) {
        children.push(childrenContent.substring(begin, end).trim());
        begin = end + 1;
      }
    }
  }

  return children.filter(e => !!e.trim());
}


export default Placeholder;