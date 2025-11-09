'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Channel, ChannelGroup } from '@/stores/workspace-store'
import { ChannelListSection, GroupedChannelList } from './ChannelListSection'

interface ChannelListProps {
  announcementChannels: Channel[]
  announcementGroup: ChannelGroup | undefined
  userGroupedChannels: Array<{ group: ChannelGroup; channels: Channel[] }>
  ungroupedChannels: Channel[]
  unjoinedChannels: Channel[]
  archivedChannels: Channel[]
  archivedGroup: ChannelGroup | undefined
  selectedChannelId: string | null
  isAdmin: boolean
  expandedSections: Record<string, boolean>
  // Callbacks
  onSelectChannel: (channel: Channel) => void
  toggleChannelFavorite: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onJoinChannel: (id: string) => void
  onLeaveChannel: (id: string) => void
  checkIsMember: (id: string) => boolean
  toggleGroupCollapse: (groupId: string) => void
  handleDeleteGroupClick: (groupId: string) => void
  onToggleExpanded: (section: string, expanded: boolean) => void
  onDragEnd: (event: DragEndEvent) => Promise<void>
}

export function ChannelList({
  announcementChannels,
  announcementGroup,
  userGroupedChannels,
  ungroupedChannels,
  unjoinedChannels,
  archivedChannels,
  archivedGroup,
  selectedChannelId,
  isAdmin,
  expandedSections,
  onSelectChannel,
  toggleChannelFavorite,
  onDelete,
  onEdit,
  onJoinChannel,
  onLeaveChannel,
  checkIsMember,
  toggleGroupCollapse,
  handleDeleteGroupClick,
  onToggleExpanded,
  onDragEnd,
}: ChannelListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const allChannels = [
    ...announcementChannels,
    ...userGroupedChannels.flatMap(g => g.channels),
    ...ungroupedChannels,
    ...unjoinedChannels,
    ...archivedChannels,
  ]

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={allChannels.map(ch => ch.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto">
          {/* 1. 公司公告（固定頂部） */}
          {announcementChannels.length > 0 && announcementGroup && (
            <GroupedChannelList
              group={announcementGroup}
              channels={announcementChannels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={onSelectChannel}
              toggleChannelFavorite={toggleChannelFavorite}
              onDelete={onDelete}
              onEdit={onEdit}
              onJoinChannel={onJoinChannel}
              onLeaveChannel={onLeaveChannel}
              isAdmin={isAdmin}
              checkIsMember={checkIsMember}
              toggleGroupCollapse={toggleGroupCollapse}
              handleDeleteGroupClick={() => {}} // 系統群組不可刪除
            />
          )}

          {/* 2. 使用者自訂群組 */}
          {userGroupedChannels.map(
            ({ group, channels: groupChannels }) =>
              groupChannels.length > 0 && (
                <GroupedChannelList
                  key={group.id}
                  group={group}
                  channels={groupChannels}
                  selectedChannelId={selectedChannelId}
                  onSelectChannel={onSelectChannel}
                  toggleChannelFavorite={toggleChannelFavorite}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onJoinChannel={onJoinChannel}
                  onLeaveChannel={onLeaveChannel}
                  isAdmin={isAdmin}
                  checkIsMember={checkIsMember}
                  toggleGroupCollapse={toggleGroupCollapse}
                  handleDeleteGroupClick={handleDeleteGroupClick}
                />
              )
          )}

          {/* 3. 未分組頻道 */}
          {ungroupedChannels.length > 0 && (
            <ChannelListSection
              channels={ungroupedChannels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={onSelectChannel}
              toggleChannelFavorite={toggleChannelFavorite}
              onDelete={onDelete}
              onEdit={onEdit}
              onJoinChannel={onJoinChannel}
              onLeaveChannel={onLeaveChannel}
              isAdmin={isAdmin}
              checkIsMember={checkIsMember}
              isExpanded={expandedSections.ungrouped !== false}
              onToggleExpanded={(expanded: boolean) => onToggleExpanded('ungrouped', expanded)}
              title="未分組"
              icon="hash"
              showAddButton
              onAddClick={() => {}}
            />
          )}

          {/* 4. 未加入的頻道 */}
          {unjoinedChannels.length > 0 && (
            <ChannelListSection
              channels={unjoinedChannels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={onSelectChannel}
              toggleChannelFavorite={toggleChannelFavorite}
              onDelete={() => {}} // 未加入的頻道不能刪除
              onEdit={() => {}} // 未加入的頻道不能編輯
              onJoinChannel={onJoinChannel}
              onLeaveChannel={() => {}} // 未加入的頻道不能離開
              isAdmin={isAdmin}
              checkIsMember={checkIsMember}
              isExpanded={expandedSections.unjoined || false}
              onToggleExpanded={(expanded: boolean) => onToggleExpanded('unjoined', expanded)}
              title="未加入的頻道"
              icon="hash"
            />
          )}

          {/* 5. 封存（固定底部，半透明顯示） */}
          {archivedChannels.length > 0 && archivedGroup && (
            <div className="opacity-60 hover:opacity-100 transition-opacity">
              <GroupedChannelList
                group={archivedGroup}
                channels={archivedChannels}
                selectedChannelId={selectedChannelId}
                onSelectChannel={onSelectChannel}
                toggleChannelFavorite={toggleChannelFavorite}
                onDelete={onDelete}
                onEdit={onEdit}
                onJoinChannel={onJoinChannel}
                onLeaveChannel={onLeaveChannel}
                isAdmin={isAdmin}
                checkIsMember={checkIsMember}
                toggleGroupCollapse={toggleGroupCollapse}
                handleDeleteGroupClick={() => {}} // 系統群組不可刪除
              />
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
