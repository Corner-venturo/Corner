import type { Dependency, IAccessor, ICommand } from '@univerjs/core'
import {
  CommandType,
  Disposable,
  ICommandService,
  Inject,
  Injector,
  Plugin,
  UniverInstanceType,
} from '@univerjs/core'
import {
  ComponentManager,
  IMenuManagerService,
  MenuItemType,
  RibbonStartGroup,
} from '@univerjs/ui'
import type { IMenuButtonItem } from '@univerjs/ui'

// ============================================
// Command IDs
// ============================================
const SAVE_COMMAND_ID = 'office.command.save'
const SAVE_AS_COMMAND_ID = 'office.command.save-as'
const EXPORT_EXCEL_COMMAND_ID = 'office.command.export-excel'

// ============================================
// 全域回調函數（由 React 組件設定）
// ============================================
type SaveCallback = () => void
type SaveAsCallback = () => void
type ExportExcelCallback = () => void

let onSaveCallback: SaveCallback | null = null
let onSaveAsCallback: SaveAsCallback | null = null
let onExportExcelCallback: ExportExcelCallback | null = null

// 讓 React 組件可以設定回調
export function setFileOperationCallbacks(callbacks: {
  onSave?: SaveCallback
  onSaveAs?: SaveAsCallback
  onExportExcel?: ExportExcelCallback
}) {
  if (callbacks.onSave) onSaveCallback = callbacks.onSave
  if (callbacks.onSaveAs) onSaveAsCallback = callbacks.onSaveAs
  if (callbacks.onExportExcel) onExportExcelCallback = callbacks.onExportExcel
}

export function clearFileOperationCallbacks() {
  onSaveCallback = null
  onSaveAsCallback = null
  onExportExcelCallback = null
}

// ============================================
// Icons
// ============================================
function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  )
}

function SaveAsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
      <circle cx="19" cy="19" r="4" fill="currentColor" stroke="none"/>
      <path d="M19 17v4M17 19h4" stroke="white" strokeWidth="1.5"/>
    </svg>
  )
}

function ExportExcelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M12 18v-6"/>
      <path d="M9 15l3 3 3-3"/>
    </svg>
  )
}

// ============================================
// Commands
// ============================================
const SaveCommand: ICommand = {
  id: SAVE_COMMAND_ID,
  type: CommandType.OPERATION,
  handler: (_accessor: IAccessor) => {
    if (onSaveCallback) {
      onSaveCallback()
    }
    return true
  },
}

const SaveAsCommand: ICommand = {
  id: SAVE_AS_COMMAND_ID,
  type: CommandType.OPERATION,
  handler: (_accessor: IAccessor) => {
    if (onSaveAsCallback) {
      onSaveAsCallback()
    }
    return true
  },
}

const ExportExcelCommand: ICommand = {
  id: EXPORT_EXCEL_COMMAND_ID,
  type: CommandType.OPERATION,
  handler: (_accessor: IAccessor) => {
    if (onExportExcelCallback) {
      onExportExcelCallback()
    }
    return true
  },
}

// ============================================
// Menu Item Factories
// ============================================
function SaveMenuItemFactory(): IMenuButtonItem<string> {
  return {
    id: SAVE_COMMAND_ID,
    type: MenuItemType.BUTTON,
    title: '儲存',
    tooltip: '儲存文件 (Ctrl+S)',
    icon: 'SaveIcon',
  }
}

function SaveAsMenuItemFactory(): IMenuButtonItem<string> {
  return {
    id: SAVE_AS_COMMAND_ID,
    type: MenuItemType.BUTTON,
    title: '另存新檔',
    tooltip: '另存新檔',
    icon: 'SaveAsIcon',
  }
}

function ExportExcelMenuItemFactory(): IMenuButtonItem<string> {
  return {
    id: EXPORT_EXCEL_COMMAND_ID,
    type: MenuItemType.BUTTON,
    title: '匯出',
    tooltip: '匯出 Excel',
    icon: 'ExportExcelIcon',
  }
}

// ============================================
// Controller
// ============================================
class FileOperationsController extends Disposable {
  constructor(
    @ICommandService private readonly _commandService: ICommandService,
    @IMenuManagerService private readonly _menuManagerService: IMenuManagerService,
    @Inject(ComponentManager) private readonly _componentManager: ComponentManager
  ) {
    super()
    this._initCommands()
    this._registerComponents()
    this._initMenus()
  }

  private _initCommands(): void {
    this.disposeWithMe(this._commandService.registerCommand(SaveCommand))
    this.disposeWithMe(this._commandService.registerCommand(SaveAsCommand))
    this.disposeWithMe(this._commandService.registerCommand(ExportExcelCommand))
  }

  private _registerComponents(): void {
    this._componentManager.register('SaveIcon', SaveIcon)
    this._componentManager.register('SaveAsIcon', SaveAsIcon)
    this._componentManager.register('ExportExcelIcon', ExportExcelIcon)
  }

  private _initMenus(): void {
    this._menuManagerService.mergeMenu({
      [RibbonStartGroup.HISTORY]: {
        [SAVE_COMMAND_ID]: {
          order: -3, // 放在 Undo/Redo 之前
          menuItemFactory: SaveMenuItemFactory,
        },
        [SAVE_AS_COMMAND_ID]: {
          order: -2,
          menuItemFactory: SaveAsMenuItemFactory,
        },
        [EXPORT_EXCEL_COMMAND_ID]: {
          order: -1,
          menuItemFactory: ExportExcelMenuItemFactory,
        },
      },
    })
  }
}

// ============================================
// Plugin
// ============================================
export class UniverFileOperationsPlugin extends Plugin {
  static override pluginName = 'UNIVER_FILE_OPERATIONS_PLUGIN'
  static override type = UniverInstanceType.UNIVER_SHEET

  constructor(
    _config: undefined,
    @Inject(Injector) protected readonly _injector: Injector
  ) {
    super()
  }

  override onStarting(): void {
    const deps: Dependency[] = [[FileOperationsController]]
    deps.forEach((dep) => this._injector.add(dep))
    this._injector.get(FileOperationsController)
  }
}

// Document 版本的 Plugin
export class UniverFileOperationsDocPlugin extends Plugin {
  static override pluginName = 'UNIVER_FILE_OPERATIONS_DOC_PLUGIN'
  static override type = UniverInstanceType.UNIVER_DOC

  constructor(
    _config: undefined,
    @Inject(Injector) protected readonly _injector: Injector
  ) {
    super()
  }

  override onStarting(): void {
    const deps: Dependency[] = [[FileOperationsController]]
    deps.forEach((dep) => this._injector.add(dep))
    this._injector.get(FileOperationsController)
  }
}
