export function injectPoisze() {
  const iframe = document.querySelector(`iframe[name="editor-canvas"]`);
  if (iframe) {
    const posizeUrl = `https://cdn.jsdelivr.net/gh/px2code/posize/build/v1.00.3.js`;
    if (iframe.contentDocument.body && !iframe.contentDocument.querySelector(`script[src="${posizeUrl}"]`)) {
      const script = iframe.contentDocument.createElement("script");
      script.src = posizeUrl;
      script.async = true;
      iframe.contentDocument.body.appendChild(script);
    }
  }
}

export function injectDashicon() {
  const iframe = document.querySelector(`iframe[name="editor-canvas"]`);
  if (iframe) {
    const dashiconsUrl = `/wp-includes/css/dashicons.css`;
    if (iframe.contentDocument.body && !iframe.contentDocument.querySelector(`link[href="${dashiconsUrl}"]`)) {
      const link = iframe.contentDocument.createElement("link");
      link.href = dashiconsUrl;
      link.rel = "stylesheet";
      link.async = true;
      iframe.contentDocument.head.appendChild(link);
    }
  }
}

export async function load(path, callback) {
  const response = await fetch(`/?rest_route=/pxcode/v1/sync/${path}`);
  const { code } = await response.json();
  const source = code.replace(/"use strict";/g, '');
  callback(source);
}

export function build(source, props) {
  if (source) {
    const componentGen = new Function('props', `return function(props) { ${source} return result; }`);
    return componentGen()(props);
  } else {
    return {
      code: (
        <div style={{ marginTop: 10, marginLeft: 10, fontSize: 12 }}>
          Loading from pxCode ...
        </div>
      ), count: 0
    };
  }
}

export function inject() {
  injectPoisze();
  injectDashicon();
}