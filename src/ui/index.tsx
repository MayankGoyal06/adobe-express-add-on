import React from "react";
import { createRoot } from "react-dom/client";
import addOnUISdk, { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { SmartBrandKitApp } from "./components/SmartBrandKitApp";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";

addOnUISdk.ready.then(async () => {
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy(RuntimeType.documentSandbox) as unknown as DocumentSandboxApi;
    
    const root = createRoot(document.getElementById("root")!);
    root.render(<SmartBrandKitApp sandboxProxy={sandboxProxy} />);
});
