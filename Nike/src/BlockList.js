import { Block, BlockCrashBoundary } from "./BlockCrashBoundary";
import { BlockEdit, store as blockEditorStore } from '@wordpress/block-editor';
import { AsyncModeProvider, useDispatch, useSelect, withDispatch, withSelect } from '@wordpress/data';
import { withFilters } from '@wordpress/components';
import { BlockHtml, createContext, RawHTML, useCallback, useMemo, useState } from '@wordpress/element';
import { compose, ifCondition, pure } from '@wordpress/compose';
import { getBlockType, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { safeHTML } from '@wordpress/dom';
import { omit } from 'lodash';

export const IntersectionObserver = createContext();
export const BlockListBlockContext = createContext();

function mergeWrapperProps(propsA, propsB) {
  const newProps = {
    ...propsA,
    ...propsB,
  };

  if (propsA && propsB && propsA.className && propsB.className) {
    newProps.className = `${propsA.className} ${propsB.className}`;
  }
  if (propsA && propsB && propsA.style && propsB.style) {
    newProps.style = { ...propsA.style, ...propsB.style };
  }

  return newProps;
}

const BlockListBlockInner = function (
  {
    mode,
    isLocked,
    canRemove,
    clientId,
    isSelected,
    isSelectionEnabled,
    className,
    name,
    isValid,
    attributes,
    wrapperProps,
    setAttributes,
    onReplace,
    onInsertBlocksAfter,
    onMerge,
    toggleSelection,
  }) {
  const themeSupportsLayout = useSelect((select) => {
    const { getSettings } = select(blockEditorStore);
    return getSettings().supportsLayout;
  }, []);
  const { removeBlock } = useDispatch(blockEditorStore);
  const onRemove = useCallback(() => removeBlock(clientId), [clientId]);

  // We wrap the BlockEdit component in a div that hides it when editing in
  // HTML mode. This allows us to render all of the ancillary pieces
  // (InspectorControls, etc.) which are inside `BlockEdit` but not
  // `BlockHTML`, even in HTML mode.
  let blockEdit = (
    <BlockEdit
      name={name}
      isSelected={isSelected}
      attributes={attributes}
      setAttributes={setAttributes}
      insertBlocksAfter={isLocked ? undefined : onInsertBlocksAfter}
      onReplace={canRemove ? onReplace : undefined}
      onRemove={canRemove ? onRemove : undefined}
      mergeBlocks={canRemove ? onMerge : undefined}
      clientId={clientId}
      isSelectionEnabled={isSelectionEnabled}
      toggleSelection={toggleSelection}
    />
  );

  const blockType = getBlockType(name);

  // Determine whether the block has props to apply to the wrapper.
  if (blockType?.getEditWrapperProps) {
    wrapperProps = mergeWrapperProps(
      wrapperProps,
      blockType.getEditWrapperProps(attributes)
    );
  }

  const isAligned =
    wrapperProps &&
    !!wrapperProps['data-align'] &&
    !themeSupportsLayout;

  // For aligned blocks, provide a wrapper element so the block can be
  // positioned relative to the block column.
  // This is only kept for classic themes that don't support layout
  // Historically we used to rely on extra divs and data-align to
  // provide the alignments styles in the editor.
  // Due to the differences between frontend and backend, we migrated
  // to the layout feature, and we're now aligning the markup of frontend
  // and backend.
  if (isAligned) {
    blockEdit = (
      <div
        className="wp-block"
        data-align={wrapperProps['data-align']}
      >
        {blockEdit}
      </div>
    );
  }

  let block;

  if (!isValid) {
    const saveContent = getSaveContent(blockType, attributes);

    block = (
      <Block className="has-warning">
        <RawHTML>{safeHTML(saveContent)}</RawHTML>
      </Block>
    );
  } else if (mode === 'html') {
    // Render blockEdit so the inspector controls don't disappear.
    // See #8969.
    block = (
      <>
        <div style={{ display: 'none' }}>{blockEdit}</div>
        <Block isHtml>
          <BlockHtml clientId={clientId}/>
        </Block>
      </>
    );
  } else if (blockType?.apiVersion > 1) {
    block = blockEdit;
  } else {
    block = <Block {...wrapperProps}>{blockEdit}</Block>;
  }

  const value = {
    clientId,
    className:
      wrapperProps?.['data-align'] && themeSupportsLayout
        ? classnames(
          className,
          `align${wrapperProps['data-align']}`
        )
        : className,
    wrapperProps: omit(wrapperProps, ['data-align']),
    isAligned,
  };
  const memoizedValue = useMemo(() => value, Object.values(value));

  return (
    <BlockListBlockContext.Provider value={memoizedValue}>
      <BlockCrashBoundary
        fallback={
          <Block className="has-warning">
            <div>This block has encountered an error and cannot be previewed.</div>
          </Block>
        }
      >
        {block}
      </BlockCrashBoundary>
    </BlockListBlockContext.Provider>
  );
}

const applyWithSelect = withSelect((select, { clientId, rootClientId }) => {
  const {
    isBlockSelected,
    getBlockMode,
    isSelectionEnabled,
    getTemplateLock,
    __unstableGetBlockWithoutInnerBlocks,
    canRemoveBlock,
    canMoveBlock,
  } = select(blockEditorStore);
  const block = __unstableGetBlockWithoutInnerBlocks(clientId);
  const isSelected = isBlockSelected(clientId);
  const templateLock = getTemplateLock(rootClientId);
  const canRemove = canRemoveBlock(clientId, rootClientId);
  const canMove = canMoveBlock(clientId, rootClientId);

  // The fallback to `{}` is a temporary fix.
  // This function should never be called when a block is not present in
  // the state. It happens now because the order in withSelect rendering
  // is not correct.
  const { name, attributes, isValid } = block || {};

  // Do not add new properties here, use `useSelect` instead to avoid
  // leaking new props to the public API (editor.BlockListBlock filter).
  return {
    mode: getBlockMode(clientId),
    isSelectionEnabled: isSelectionEnabled(),
    isLocked: !!templateLock,
    canRemove,
    canMove,
    // Users of the editor.BlockListBlock filter used to be able to
    // access the block prop.
    // Ideally these blocks would rely on the clientId prop only.
    // This is kept for backward compatibility reasons.
    block,
    name,
    attributes,
    isValid,
    isSelected,
  };
});

const applyWithDispatch = withDispatch((dispatch, ownProps, { select }) => {
  const {
    updateBlockAttributes,
    insertBlocks,
    mergeBlocks,
    replaceBlocks,
    toggleSelection,
    __unstableMarkLastChangeAsPersistent,
  } = dispatch(blockEditorStore);

  // Do not add new properties here, use `useDispatch` instead to avoid
  // leaking new props to the public API (editor.BlockListBlock filter).
  return {
    setAttributes(newAttributes) {
      const { getMultiSelectedBlockClientIds } = select(
        blockEditorStore
      );
      const multiSelectedBlockClientIds = getMultiSelectedBlockClientIds();
      const { clientId } = ownProps;
      const clientIds = multiSelectedBlockClientIds.length
        ? multiSelectedBlockClientIds
        : [clientId];

      updateBlockAttributes(clientIds, newAttributes);
    },
    onInsertBlocks(blocks, index) {
      const { rootClientId } = ownProps;
      insertBlocks(blocks, index, rootClientId);
    },
    onInsertBlocksAfter(blocks) {
      const { clientId, rootClientId } = ownProps;
      const { getBlockIndex } = select(blockEditorStore);
      const index = getBlockIndex(clientId);
      insertBlocks(blocks, index + 1, rootClientId);
    },
    onMerge(forward) {
      const { clientId } = ownProps;
      const { getPreviousBlockClientId, getNextBlockClientId } = select(
        blockEditorStore
      );

      if (forward) {
        const nextBlockClientId = getNextBlockClientId(clientId);
        if (nextBlockClientId) {
          mergeBlocks(clientId, nextBlockClientId);
        }
      } else {
        const previousBlockClientId = getPreviousBlockClientId(
          clientId
        );
        if (previousBlockClientId) {
          mergeBlocks(previousBlockClientId, clientId);
        }
      }
    },
    onReplace(blocks, indexToSelect, initialPosition) {
      if (
        blocks.length &&
        !isUnmodifiedDefaultBlock(blocks[blocks.length - 1])
      ) {
        __unstableMarkLastChangeAsPersistent();
      }
      replaceBlocks(
        [ownProps.clientId],
        blocks,
        indexToSelect,
        initialPosition
      );
    },
    toggleSelection(selectionEnabled) {
      toggleSelection(selectionEnabled);
    },
  };
});

const BlockListBlock = compose(
  pure,
  applyWithSelect,
  applyWithDispatch,
  ifCondition(({ block }) => !!block),
  withFilters('editor.BlockListBlockInner')
)(BlockListBlockInner);

const Item = ({ rootClientId, orderIndex }) => {
  const [intersectingBlocks, setIntersectingBlocks] = useState(new Set());
  const intersectionObserver = useMemo(() => {
    const { IntersectionObserver: Observer } = window;
    if (!Observer) {
      return;
    }

    return new Observer((entries) => {
      setIntersectingBlocks((oldIntersectingBlocks) => {
        const newIntersectingBlocks = new Set(oldIntersectingBlocks);
        for (const entry of entries) {
          const clientId = entry.target.getAttribute('data-block');
          const action = entry.isIntersecting ? 'add' : 'delete';
          newIntersectingBlocks[action](clientId);
        }
        return newIntersectingBlocks;
      });
    });
  }, [setIntersectingBlocks]);

  const { order, selectedBlocks } = useSelect(
    (select) => {
      const { getBlockOrder, getSelectedBlockClientIds } = select(
        blockEditorStore
      );
      return {
        order: getBlockOrder(rootClientId),
        selectedBlocks: getSelectedBlockClientIds(),
      };
    },
    [rootClientId]
  );

  const clientId = order[orderIndex];
  if (!clientId) {
    return null;
  }

  return (
    <IntersectionObserver.Provider value={intersectionObserver}>
      <AsyncModeProvider
        key={clientId}
        value={
          // Only provide data asynchronously if the block is
          // not visible and not selected.
          !intersectingBlocks.has(clientId) &&
          !selectedBlocks.includes(clientId)
        }
      >
        <BlockListBlock
          rootClientId={rootClientId}
          clientId={clientId}
        />
      </AsyncModeProvider>
    </IntersectionObserver.Provider>
  );
}

export default function BlockListItem(props) {
  // This component needs to always be synchronous as it's the one changing
  // the async mode depending on the block selection.
  return (
    <AsyncModeProvider value={false}>
      <Item {...props} />
    </AsyncModeProvider>
  );
}
