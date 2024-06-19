sap.ui.define(["sap/ui/core/Control", "../marked/marked.min"], (Control /*, marked */) => {
    return Control.extend("cc.md.Markdown", {
        metadata: {
            properties: {
                content: { type: "string", defaultValue: "", bindable: "bindable" },
                fromFile: { type: "string", defaultValue: "", bindable: "bindable" },
                baseURL: { type: "string", defaultValue: "", bindable: "bindable" }
            }
        },
        init() {
            console.debug(`[${this.getMetadata().getName()}] > init`)
        },
        renderer: {
            apiVersion: 2, // high-perf!
            /**
             * create the view layer by outputting html
             *
             * @param {sap.ui.core.RenderManager} oRM Render Manager v2
             * @param {sap.ui.core.Control} oControl this control, ui5-cc-md.Markdown
             */
            render(oRM, oControl) {
                marked.setOptions({
                    baseUrl: oControl.getBaseURL()
                })
                console.debug(`[${oControl.getMetadata().getName()}] > rendering`)
                oRM.openStart("div", oControl)
                oRM.openEnd()
                const sMarkdown = oControl.getContent()
                if (!sMarkdown && !oControl.getFromFile()) {
                    console.debug(`[${oControl.getMetadata().getName()}] > no content available`)
                    oRM.close("div")
                    return
                }
                if (sMarkdown) {
                    const sHtml = marked.parse(sMarkdown)
                    oRM.unsafeHtml(sHtml)
                    oRM.close("div")
                } else if (oControl.getFromFile()) {
                    fetch(oControl.getFromFile())
                        .then((r) => r.text())
                        .then((md) => oControl.setContent(md)) // make md available (via .getContent()) to the rendering cycle
                        .catch((err) => console.error(`[${oControl.getMetadata().getName()}] > ERR: ${err}`))
                    oRM.close("div")
                }
            }
        }
    })
})
