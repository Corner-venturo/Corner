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
  IMenuManagerService,
  MenuItemType,
  RibbonStartGroup,
} from '@univerjs/ui'
import type { IMenuButtonItem } from '@univerjs/ui'

// Command ID
const BACK_TO_LIST_SLIDES_COMMAND_ID = 'office.command.back-to-list-slides'

// Command handler
const BackToListSlidesCommand: ICommand = {
  id: BACK_TO_LIST_SLIDES_COMMAND_ID,
  type: CommandType.OPERATION,
  handler: (_accessor: IAccessor) => {
    if (typeof window !== 'undefined') {
      window.location.href = '/office'
    }
    return true
  },
}

// Menu item factory - 不使用自訂圖標，使用箭頭符號
function BackToListSlidesMenuItemFactory(): IMenuButtonItem<string> {
  return {
    id: BACK_TO_LIST_SLIDES_COMMAND_ID,
    type: MenuItemType.BUTTON,
    title: '← 返回',
    tooltip: '返回文件列表',
  }
}

// Controller - 簡化版，不依賴 ComponentManager
class BackToListSlidesController extends Disposable {
  constructor(
    @ICommandService private readonly _commandService: ICommandService,
    @IMenuManagerService private readonly _menuManagerService: IMenuManagerService
  ) {
    super()
    this._initCommands()
    this._initMenus()
  }

  private _initCommands(): void {
    this.disposeWithMe(this._commandService.registerCommand(BackToListSlidesCommand))
  }

  private _initMenus(): void {
    this._menuManagerService.mergeMenu({
      [RibbonStartGroup.HISTORY]: {
        [BACK_TO_LIST_SLIDES_COMMAND_ID]: {
          order: -1, // 放在 undo/redo 前面
          menuItemFactory: BackToListSlidesMenuItemFactory,
        },
      },
    })
  }
}

// Plugin for Slides
export class UniverBackToListSlidesPlugin extends Plugin {
  static override pluginName = 'UNIVER_BACK_TO_LIST_SLIDES_PLUGIN'
  // 使用 UNIVER_UNKNOWN 讓 plugin 可以在任何類型的 instance 上運行
  static override type = UniverInstanceType.UNIVER_UNKNOWN

  constructor(
    _config: undefined,
    @Inject(Injector) protected readonly _injector: Injector
  ) {
    super()
  }

  override onStarting(): void {
    // 延遲初始化，確保所有服務已註冊
    setTimeout(() => {
      try {
        const deps: Dependency[] = [[BackToListSlidesController]]
        deps.forEach((dep) => this._injector.add(dep))
        // 取得 controller 觸發初始化
        this._injector.get(BackToListSlidesController)
      } catch (error) {
        // Slides UI 可能尚未完全載入，這是預期的行為
      }
    }, 0)
  }
}
