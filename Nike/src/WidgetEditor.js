import { Icon, SlotFillProvider } from '@wordpress/components';
import { InnerBlocks } from '@wordpress/block-editor';
import { useMemo, useState } from '@wordpress/element';

const allowBlocks = ['core/group'];
const highlightStyle = { color: '#1f81ff', textDecoration: 'underline' };

const WidgetEditor = ({ totalChildBlockCount, name, highlight, lock, syncing, onLock, onSync }) => {
  const template = useMemo(
    () => {
      const t = [];
      for (let index = 0; index < totalChildBlockCount; index += 1) {
        t.push(['core/group', {}]);
      }
      return t;
    },
    [totalChildBlockCount],
  );

  const [collapse, setCollapse] = useState(true);

  return (
    <div
      style={{
        padding: 20,
        color: '#1e1e1e',
        boxShadow: 'inset 0 0 0 1px #1e1e1e'
      }}>
      <div style={{ display: 'flex', fontSize: 20, fontWeight: 400 }}>

        <Icon icon="admin-appearance"/>
        <div style={{ fontSize: 16, flexGrow: 1, marginLeft: 10 }}> pxCode {name} Widget</div>
        <Icon
          onClick={onSync}
          icon={'update'}
          style={{
            marginLeft: 'auto',
            marginTop: 5,
            marginRight: 5,
            width: 20,
            height: 20,
            cursor: 'pointer',
            animation: syncing ? 'spin 2s linear infinite' : null
          }}/>
        <Icon
          onClick={(e) => onLock(!lock)}
          icon={lock ? 'lock' : 'unlock'}
          style={{ marginLeft: 'auto', marginTop: 5, width: 30, height: 30, cursor: 'pointer' }}/>
        <Icon
          onClick={(e) => setCollapse(!collapse)}
          icon={collapse ? 'arrow-up-alt2' : 'arrow-down-alt2'}
          style={{ marginLeft: 'auto', marginTop: 5, width: 30, height: 30, cursor: 'pointer' }}/>

      </div>
      <div style={{ fontSize: 12 }}>
        There are <span style={highlight ? highlightStyle : null}>
            {totalChildBlockCount} pxCode placeholder{totalChildBlockCount > 1 ? 's' : ''}
          </span>, you have added block{totalChildBlockCount > 1 ? 's' : ''}.
      </div>
      <div style={{ height: collapse ? 0 : 'auto', overflow: 'hidden', marginTop: collapse ? null : 10 }}>
        <SlotFillProvider>
          <InnerBlocks
            template={template}
            templateLock={lock ? 'all' : false}
            allowedBlocks={allowBlocks}
            renderAppender={false}
          />
        </SlotFillProvider>
      </div>
    </div>
  );
};

export default WidgetEditor;