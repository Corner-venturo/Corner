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
import { OFFICE_LABELS } from '../constants/labels'

// Command ID
const BACK_TO_LIST_COMMAND_ID = 'office.command.back-to-list'

// Custom Icon Component - 返回箭頭
function BackToListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  )
}

// Command handler
const BackToListCommand: ICommand = {
  id: BACK_TO_LIST_COMMAND_ID,
  type: CommandType.OPERATION,
  handler: (_accessor: IAccessor) => {
    if (typeof window !== 'undefined') {
      window.location.href = '/office'
    }
    return true
  },
}

// Menu item factory
function BackToListMenuItemFactory(): IMenuButtonItem<string> {
  return {
    id: BACK_TO_LIST_COMMAND_ID,
    type: MenuItemType.BUTTON,
    title: OFFICE_LABELS.返回列表,
    tooltip: OFFICE_LABELS.返回文件列表,
    icon: 'BackToListIcon',
  }
}

// Controller
class BackToListController extends Disposable {
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
    this.disposeWithMe(this._commandService.registerCommand(BackToListCommand))
  }

  private _registerComponents(): void {
    this._componentManager.register('BackToListIcon', BackToListIcon)
  }

  private _initMenus(): void {
    this._menuManagerService.mergeMenu({
      [RibbonStartGroup.HISTORY]: {
        [BACK_TO_LIST_COMMAND_ID]: {
          order: -10, // 放在最前面
          menuItemFactory: BackToListMenuItemFactory,
        },
      },
    })
  }
}

// Plugin
export class UniverBackToListPlugin extends Plugin {
  static override pluginName = 'UNIVER_BACK_TO_LIST_PLUGIN'
  static override type = UniverInstanceType.UNIVER_SHEET

  constructor(
    _config: undefined,
    @Inject(Injector) protected readonly _injector: Injector
  ) {
    super()
  }

  override onStarting(): void {
    const deps: Dependency[] = [[BackToListController]]
    deps.forEach((dep) => this._injector.add(dep))
    // 立即取得 controller 觸發初始化
    this._injector.get(BackToListController)
  }
}
