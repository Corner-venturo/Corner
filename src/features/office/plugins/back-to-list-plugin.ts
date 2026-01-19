import type { Dependency, ICommand } from '@univerjs/core'
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

// Command ID
const BACK_TO_LIST_COMMAND_ID = 'office.command.back-to-list'

// Command handler
const BackToListCommand: ICommand = {
  id: BACK_TO_LIST_COMMAND_ID,
  type: CommandType.OPERATION,
  handler: () => {
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
    title: '返回列表',
    icon: 'LeftSingle',
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
    this._initMenus()
  }

  private _initCommands(): void {
    this.disposeWithMe(this._commandService.registerCommand(BackToListCommand))
  }

  private _initMenus(): void {
    this._menuManagerService.mergeMenu({
      [RibbonStartGroup.OTHERS]: {
        [BACK_TO_LIST_COMMAND_ID]: {
          order: -100, // 放在最前面
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
  }

  override onRendered(): void {
    this._injector.get(BackToListController)
  }
}
