import { contextBridge, ipcRenderer } from "electron";
import type {
  CliStatus,
  CompileRequest,
  DoctorRequest,
  OpenPathRequest,
  OpenPathResult,
  ProjectSpineApi,
  RunResult,
  SelectPathRequest,
  TemplateListRequest,
} from "./contracts";

const api: ProjectSpineApi = {
  getStatus: () => ipcRenderer.invoke("spine:status") as Promise<CliStatus>,
  selectPath: (request: SelectPathRequest) => ipcRenderer.invoke("paths:select", request) as Promise<string | null>,
  runDoctor: (request: DoctorRequest) => ipcRenderer.invoke("spine:doctor", request) as Promise<RunResult>,
  runCompile: (request: CompileRequest) => ipcRenderer.invoke("spine:compile", request) as Promise<RunResult>,
  listTemplates: (request?: TemplateListRequest) => ipcRenderer.invoke("spine:templates", request) as Promise<RunResult>,
  openPath: (request: OpenPathRequest) => ipcRenderer.invoke("paths:open", request) as Promise<OpenPathResult>,
};

contextBridge.exposeInMainWorld("projectSpine", api);
