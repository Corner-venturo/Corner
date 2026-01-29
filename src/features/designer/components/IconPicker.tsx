'use client'

/**
 * IconPicker - 圖示選擇器
 *
 * 使用 Iconify API 搜尋大量可商用圖示
 * 支援中文搜尋（自動轉換為英文關鍵字）
 */

import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { Icon } from '@iconify/react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface IconPickerProps {
  onSelectIcon: (iconName: string, iconSet: string) => void
}

// 可商用圖示集（MIT / Apache 2.0 / CC BY 授權）
const ICON_SETS = [
  { prefix: 'mdi', name: 'Material Design', license: 'Apache 2.0' },
  { prefix: 'tabler', name: 'Tabler', license: 'MIT' },
  { prefix: 'ph', name: 'Phosphor', license: 'MIT' },
  { prefix: 'lucide', name: 'Lucide', license: 'ISC' },
  { prefix: 'carbon', name: 'Carbon', license: 'Apache 2.0' },
  { prefix: 'heroicons', name: 'Heroicons', license: 'MIT' },
  { prefix: 'bi', name: 'Bootstrap', license: 'MIT' },
  { prefix: 'ri', name: 'Remix Icon', license: 'Apache 2.0' },
  { prefix: 'iconoir', name: 'Iconoir', license: 'MIT' },
  { prefix: 'solar', name: 'Solar', license: 'CC BY 4.0' },
  { prefix: 'fluent', name: 'Fluent UI', license: 'MIT' },
  { prefix: 'ant-design', name: 'Ant Design', license: 'MIT' },
  { prefix: 'eva', name: 'Eva Icons', license: 'MIT' },
  { prefix: 'feather', name: 'Feather', license: 'MIT' },
  { prefix: 'octicon', name: 'Octicons', license: 'MIT' },
  { prefix: 'ion', name: 'Ionicons', license: 'MIT' },
]

// 每個圖示集的預設圖示
const ICONS_BY_SET: Record<string, string[]> = {
  mdi: [
  // 交通
  'mdi:airplane', 'mdi:airplane-takeoff', 'mdi:airplane-landing', 'mdi:airport',
  'mdi:bus', 'mdi:bus-side', 'mdi:bus-stop', 'mdi:train', 'mdi:train-car', 'mdi:train-variant',
  'mdi:car', 'mdi:car-side', 'mdi:car-convertible', 'mdi:car-sports', 'mdi:car-estate',
  'mdi:taxi', 'mdi:ship', 'mdi:ferry', 'mdi:sailboat', 'mdi:anchor',
  'mdi:walk', 'mdi:run', 'mdi:run-fast', 'mdi:bike', 'mdi:bike-fast', 'mdi:motorbike', 'mdi:scooter', 'mdi:scooter-electric',
  'mdi:subway', 'mdi:subway-variant', 'mdi:tram', 'mdi:tram-side', 'mdi:helicopter', 'mdi:rocket', 'mdi:rocket-launch',
  'mdi:cable-car', 'mdi:gondola', 'mdi:truck', 'mdi:truck-delivery', 'mdi:van-passenger', 'mdi:van-utility',
  // 地點導航
  'mdi:map-marker', 'mdi:map-marker-outline', 'mdi:map-marker-check', 'mdi:map-marker-plus', 'mdi:map-marker-star',
  'mdi:map-marker-radius', 'mdi:map-marker-distance', 'mdi:map-marker-path', 'mdi:map-marker-multiple',
  'mdi:map', 'mdi:map-outline', 'mdi:map-search', 'mdi:map-legend', 'mdi:compass', 'mdi:compass-outline', 'mdi:compass-rose',
  'mdi:earth', 'mdi:globe-model', 'mdi:web', 'mdi:flag', 'mdi:flag-outline', 'mdi:flag-triangle', 'mdi:flag-variant',
  'mdi:navigation', 'mdi:navigation-variant', 'mdi:crosshairs-gps', 'mdi:directions', 'mdi:directions-fork', 'mdi:sign-direction',
  'mdi:routes', 'mdi:highway', 'mdi:road', 'mdi:road-variant', 'mdi:bridge', 'mdi:tunnel',
  // 住宿
  'mdi:hotel', 'mdi:bed', 'mdi:bed-outline', 'mdi:bed-double', 'mdi:bed-double-outline', 'mdi:bed-single', 'mdi:bed-single-outline',
  'mdi:bed-king', 'mdi:bed-queen', 'mdi:bunk-bed', 'mdi:bunk-bed-outline',
  'mdi:home', 'mdi:home-outline', 'mdi:home-city', 'mdi:home-city-outline', 'mdi:home-modern', 'mdi:home-variant',
  'mdi:office-building', 'mdi:office-building-outline', 'mdi:domain', 'mdi:city', 'mdi:city-variant',
  'mdi:warehouse', 'mdi:hut', 'mdi:tent', 'mdi:caravan', 'mdi:rv-truck', 'mdi:cabin',
  'mdi:door', 'mdi:door-open', 'mdi:door-closed', 'mdi:window-closed', 'mdi:window-open',
  // 餐飲
  'mdi:food', 'mdi:food-outline', 'mdi:food-fork-drink', 'mdi:food-takeout-box', 'mdi:food-variant',
  'mdi:silverware-fork-knife', 'mdi:silverware', 'mdi:silverware-variant', 'mdi:silverware-spoon',
  'mdi:restaurant', 'mdi:chef-hat', 'mdi:grill', 'mdi:grill-outline', 'mdi:stove',
  'mdi:coffee', 'mdi:coffee-outline', 'mdi:coffee-maker', 'mdi:coffee-to-go', 'mdi:tea', 'mdi:tea-outline',
  'mdi:beer', 'mdi:beer-outline', 'mdi:glass-wine', 'mdi:glass-cocktail', 'mdi:cocktail', 'mdi:liquor', 'mdi:bottle-wine',
  'mdi:food-apple', 'mdi:food-apple-outline', 'mdi:fruit-grapes', 'mdi:fruit-cherries', 'mdi:fruit-watermelon',
  'mdi:ice-cream', 'mdi:cupcake', 'mdi:cake', 'mdi:cake-variant', 'mdi:candy', 'mdi:candy-outline',
  'mdi:pizza', 'mdi:hamburger', 'mdi:french-fries', 'mdi:hotdog', 'mdi:taco', 'mdi:burrito',
  'mdi:noodles', 'mdi:rice', 'mdi:bowl', 'mdi:bowl-mix', 'mdi:pasta', 'mdi:sausage',
  'mdi:bread-slice', 'mdi:bread-slice-outline', 'mdi:croissant', 'mdi:baguette', 'mdi:cookie', 'mdi:muffin',
  'mdi:egg', 'mdi:egg-fried', 'mdi:cheese', 'mdi:fish', 'mdi:shrimp',
  // 景點
  'mdi:bank', 'mdi:bank-outline', 'mdi:castle', 'mdi:church', 'mdi:mosque', 'mdi:synagogue',
  'mdi:temple-buddhist', 'mdi:temple-hindu', 'mdi:torii-gate', 'mdi:cross', 'mdi:cross-outline',
  'mdi:stadium', 'mdi:stadium-variant', 'mdi:ferris-wheel', 'mdi:roller-coaster', 'mdi:eiffel-tower',
  'mdi:beach', 'mdi:island', 'mdi:palm-tree', 'mdi:pine-tree', 'mdi:tree', 'mdi:tree-outline', 'mdi:forest',
  'mdi:mountain', 'mdi:terrain', 'mdi:volcano', 'mdi:waterfall', 'mdi:image-filter-hdr',
  'mdi:waves', 'mdi:wave', 'mdi:pool', 'mdi:hot-tub', 'mdi:spa', 'mdi:spa-outline',
  'mdi:flower', 'mdi:flower-outline', 'mdi:flower-tulip', 'mdi:flower-tulip-outline', 'mdi:rose', 'mdi:clover',
  'mdi:nature', 'mdi:nature-people', 'mdi:leaf', 'mdi:leaf-maple', 'mdi:sprout', 'mdi:grass',
  'mdi:museum', 'mdi:theater', 'mdi:drama-masks', 'mdi:palette', 'mdi:brush',
  'mdi:fountain', 'mdi:lighthouse', 'mdi:lighthouse-on', 'mdi:pier', 'mdi:pier-crane',
  // 天氣
  'mdi:weather-sunny', 'mdi:white-balance-sunny', 'mdi:brightness-5', 'mdi:brightness-7',
  'mdi:weather-cloudy', 'mdi:weather-partly-cloudy', 'mdi:cloud', 'mdi:cloud-outline',
  'mdi:weather-rainy', 'mdi:weather-pouring', 'mdi:umbrella', 'mdi:umbrella-outline',
  'mdi:weather-snowy', 'mdi:weather-snowy-heavy', 'mdi:weather-snowy-rainy', 'mdi:snowflake', 'mdi:snowflake-variant',
  'mdi:weather-windy', 'mdi:weather-windy-variant', 'mdi:weather-fog', 'mdi:weather-hazy',
  'mdi:weather-lightning', 'mdi:weather-lightning-rainy', 'mdi:flash', 'mdi:flash-outline',
  'mdi:thermometer', 'mdi:thermometer-high', 'mdi:thermometer-low', 'mdi:thermometer-lines',
  'mdi:moon-waning-crescent', 'mdi:moon-full', 'mdi:moon-new', 'mdi:weather-night', 'mdi:weather-night-partly-cloudy',
  'mdi:weather-sunset', 'mdi:weather-sunset-down', 'mdi:weather-sunset-up',
  // 時間
  'mdi:calendar', 'mdi:calendar-outline', 'mdi:calendar-month', 'mdi:calendar-month-outline',
  'mdi:calendar-today', 'mdi:calendar-week', 'mdi:calendar-range', 'mdi:calendar-multiselect',
  'mdi:calendar-check', 'mdi:calendar-check-outline', 'mdi:calendar-clock', 'mdi:calendar-star',
  'mdi:clock', 'mdi:clock-outline', 'mdi:clock-time-eight', 'mdi:clock-time-four',
  'mdi:alarm', 'mdi:alarm-check', 'mdi:alarm-plus', 'mdi:timer', 'mdi:timer-outline', 'mdi:timer-sand', 'mdi:history',
  // 通訊
  'mdi:phone', 'mdi:phone-outline', 'mdi:phone-in-talk', 'mdi:phone-message', 'mdi:cellphone', 'mdi:cellphone-basic',
  'mdi:email', 'mdi:email-outline', 'mdi:email-open', 'mdi:at', 'mdi:send', 'mdi:send-outline',
  'mdi:chat', 'mdi:chat-outline', 'mdi:chat-processing', 'mdi:message', 'mdi:message-outline', 'mdi:message-text',
  'mdi:forum', 'mdi:forum-outline', 'mdi:comment', 'mdi:comment-outline', 'mdi:comment-multiple',
  'mdi:wifi', 'mdi:wifi-strength-4', 'mdi:signal', 'mdi:signal-cellular-3', 'mdi:antenna',
  // 旅遊用品
  'mdi:passport', 'mdi:passport-biometric', 'mdi:card-account-details', 'mdi:card-account-details-outline',
  'mdi:briefcase', 'mdi:briefcase-outline', 'mdi:briefcase-variant', 'mdi:bag-suitcase', 'mdi:bag-suitcase-outline',
  'mdi:bag-checked', 'mdi:bag-personal', 'mdi:bag-personal-outline', 'mdi:backpack', 'mdi:backpack-outline',
  'mdi:shopping-bag', 'mdi:shopping', 'mdi:shopping-outline',
  'mdi:camera', 'mdi:camera-outline', 'mdi:camera-enhance', 'mdi:camera-plus', 'mdi:video', 'mdi:video-outline',
  'mdi:image', 'mdi:image-outline', 'mdi:image-multiple', 'mdi:panorama', 'mdi:panorama-wide-angle',
  'mdi:binoculars', 'mdi:telescope', 'mdi:flashlight', 'mdi:flashlight-off', 'mdi:sunglasses',
  'mdi:key', 'mdi:key-outline', 'mdi:key-variant', 'mdi:locker', 'mdi:locker-multiple', 'mdi:safe', 'mdi:lock',
  // 購物
  'mdi:cash', 'mdi:cash-multiple', 'mdi:cash-100', 'mdi:currency-usd', 'mdi:currency-eur', 'mdi:currency-jpy', 'mdi:currency-gbp',
  'mdi:credit-card', 'mdi:credit-card-outline', 'mdi:credit-card-chip', 'mdi:wallet', 'mdi:wallet-outline',
  'mdi:cart', 'mdi:cart-outline', 'mdi:cart-plus', 'mdi:basket', 'mdi:basket-outline',
  'mdi:store', 'mdi:store-outline', 'mdi:storefront', 'mdi:storefront-outline',
  'mdi:gift', 'mdi:gift-outline', 'mdi:gift-open', 'mdi:sale', 'mdi:tag', 'mdi:tag-outline', 'mdi:tag-multiple',
  'mdi:ticket', 'mdi:ticket-outline', 'mdi:ticket-confirmation', 'mdi:barcode', 'mdi:qrcode',
  // 評價
  'mdi:star', 'mdi:star-outline', 'mdi:star-half-full', 'mdi:star-circle', 'mdi:star-box',
  'mdi:heart', 'mdi:heart-outline', 'mdi:heart-half', 'mdi:heart-multiple', 'mdi:heart-circle',
  'mdi:thumb-up', 'mdi:thumb-up-outline', 'mdi:thumb-down', 'mdi:thumb-down-outline',
  'mdi:check', 'mdi:check-bold', 'mdi:check-circle', 'mdi:check-circle-outline', 'mdi:check-all',
  'mdi:close', 'mdi:close-circle', 'mdi:close-circle-outline', 'mdi:close-box', 'mdi:cancel',
  'mdi:emoticon-happy', 'mdi:emoticon-happy-outline', 'mdi:emoticon-sad', 'mdi:emoticon-neutral', 'mdi:emoticon-cool',
  // 資訊
  'mdi:information', 'mdi:information-outline', 'mdi:information-variant', 'mdi:help-circle', 'mdi:help-circle-outline',
  'mdi:alert', 'mdi:alert-outline', 'mdi:alert-circle', 'mdi:alert-circle-outline', 'mdi:alert-octagon',
  'mdi:lightbulb', 'mdi:lightbulb-outline', 'mdi:lightbulb-on', 'mdi:lightbulb-on-outline',
  'mdi:bell', 'mdi:bell-outline', 'mdi:bell-ring', 'mdi:bell-ring-outline',
  'mdi:bookmark', 'mdi:bookmark-outline', 'mdi:bookmark-check', 'mdi:pin', 'mdi:pin-outline',
  // 設施
  'mdi:parking', 'mdi:gas-station', 'mdi:gas-station-outline', 'mdi:ev-station', 'mdi:ev-plug-type2',
  'mdi:toilet', 'mdi:human-male', 'mdi:human-female', 'mdi:human-male-female', 'mdi:baby-carriage',
  'mdi:wheelchair-accessibility', 'mdi:elevator', 'mdi:elevator-passenger', 'mdi:escalator', 'mdi:escalator-up',
  'mdi:smoking', 'mdi:smoking-off', 'mdi:paw', 'mdi:paw-outline', 'mdi:paw-off',
  'mdi:air-conditioner', 'mdi:fan', 'mdi:fan-off', 'mdi:television', 'mdi:television-classic',
  'mdi:power-plug', 'mdi:power-plug-outline', 'mdi:battery-charging', 'mdi:battery-charging-100', 'mdi:usb',
  'mdi:shower', 'mdi:shower-head', 'mdi:bathtub', 'mdi:bathtub-outline', 'mdi:faucet', 'mdi:water',
  // 健康安全
  'mdi:hospital', 'mdi:hospital-building', 'mdi:hospital-box', 'mdi:hospital-marker', 'mdi:ambulance',
  'mdi:medical-bag', 'mdi:first-aid', 'mdi:pill', 'mdi:pill-multiple', 'mdi:bandage', 'mdi:needle',
  'mdi:stethoscope', 'mdi:doctor', 'mdi:nurse', 'mdi:virus', 'mdi:bacteria',
  'mdi:shield-check', 'mdi:shield-check-outline', 'mdi:security', 'mdi:police-badge', 'mdi:police-badge-outline',
  'mdi:fire-extinguisher', 'mdi:fire', 'mdi:fire-alert', 'mdi:exit-run', 'mdi:lifebuoy',
  // 活動
  'mdi:hiking', 'mdi:walk', 'mdi:swim', 'mdi:diving-scuba', 'mdi:diving-snorkel', 'mdi:ski', 'mdi:ski-water', 'mdi:snowboard',
  'mdi:golf', 'mdi:golf-tee', 'mdi:tennis', 'mdi:tennis-ball', 'mdi:basketball', 'mdi:soccer', 'mdi:volleyball',
  'mdi:music', 'mdi:music-note', 'mdi:music-circle', 'mdi:microphone', 'mdi:microphone-variant', 'mdi:guitar-acoustic',
  'mdi:gamepad-variant', 'mdi:controller', 'mdi:cards-playing', 'mdi:dice-5', 'mdi:puzzle', 'mdi:chess-knight',
  'mdi:yoga', 'mdi:meditation', 'mdi:dumbbell', 'mdi:weight-lifter', 'mdi:karate', 'mdi:boxing-glove',
  'mdi:bike', 'mdi:kayaking', 'mdi:canoe', 'mdi:surfing', 'mdi:skateboarding', 'mdi:roller-skate',
  // 人物
  'mdi:account', 'mdi:account-outline', 'mdi:account-circle', 'mdi:account-circle-outline',
  'mdi:account-group', 'mdi:account-group-outline', 'mdi:account-multiple', 'mdi:account-multiple-outline',
  'mdi:family', 'mdi:human-male-child', 'mdi:human-female-girl', 'mdi:human-cane',
  'mdi:face-man', 'mdi:face-man-outline', 'mdi:face-woman', 'mdi:face-woman-outline', 'mdi:baby-face', 'mdi:baby-face-outline',
  'mdi:human-greeting', 'mdi:human-greeting-variant', 'mdi:hand-wave', 'mdi:handshake', 'mdi:handshake-outline',
  // 箭頭
  'mdi:arrow-up', 'mdi:arrow-down', 'mdi:arrow-left', 'mdi:arrow-right',
  'mdi:arrow-up-bold', 'mdi:arrow-down-bold', 'mdi:arrow-left-bold', 'mdi:arrow-right-bold',
  'mdi:arrow-up-circle', 'mdi:arrow-down-circle', 'mdi:arrow-left-circle', 'mdi:arrow-right-circle',
  'mdi:chevron-up', 'mdi:chevron-down', 'mdi:chevron-left', 'mdi:chevron-right',
  'mdi:chevron-double-up', 'mdi:chevron-double-down', 'mdi:chevron-double-left', 'mdi:chevron-double-right',
  'mdi:menu-up', 'mdi:menu-down', 'mdi:menu-left', 'mdi:menu-right', 'mdi:swap-horizontal', 'mdi:swap-vertical',
  // 數字符號
  'mdi:numeric-1-circle', 'mdi:numeric-2-circle', 'mdi:numeric-3-circle', 'mdi:numeric-4-circle', 'mdi:numeric-5-circle',
  'mdi:numeric-6-circle', 'mdi:numeric-7-circle', 'mdi:numeric-8-circle', 'mdi:numeric-9-circle', 'mdi:numeric-0-circle',
  'mdi:numeric-1-box', 'mdi:numeric-2-box', 'mdi:numeric-3-box', 'mdi:numeric-4-box', 'mdi:numeric-5-box',
  'mdi:alpha-a-circle', 'mdi:alpha-b-circle', 'mdi:alpha-c-circle', 'mdi:alpha-d-circle', 'mdi:alpha-e-circle',
  'mdi:plus', 'mdi:plus-circle', 'mdi:minus', 'mdi:minus-circle', 'mdi:multiplication', 'mdi:division', 'mdi:equal',
  'mdi:circle', 'mdi:circle-outline', 'mdi:square', 'mdi:square-outline', 'mdi:triangle', 'mdi:triangle-outline',
  'mdi:hexagon', 'mdi:hexagon-outline', 'mdi:pentagon', 'mdi:octagon', 'mdi:rhombus', 'mdi:diamond',
  ],

  tabler: [
    // 交通
    'tabler:plane', 'tabler:plane-departure', 'tabler:plane-arrival', 'tabler:plane-inflight', 'tabler:plane-tilt',
    'tabler:bus', 'tabler:bus-stop', 'tabler:train', 'tabler:tram', 'tabler:car', 'tabler:car-suv', 'tabler:car-garage',
    'tabler:ship', 'tabler:sailboat', 'tabler:sailboat-2', 'tabler:anchor', 'tabler:walk', 'tabler:run',
    'tabler:bike', 'tabler:motorbike', 'tabler:scooter', 'tabler:scooter-electric', 'tabler:helicopter', 'tabler:submarine',
    'tabler:rocket', 'tabler:drone', 'tabler:truck', 'tabler:truck-delivery', 'tabler:forklift', 'tabler:tractor',
    'tabler:ambulance', 'tabler:firetruck', 'tabler:trolley', 'tabler:cable-car', 'tabler:aerial-lift',
    // 地點
    'tabler:map-pin', 'tabler:map-pin-filled', 'tabler:map-pin-off', 'tabler:map-pin-check', 'tabler:map-pin-plus',
    'tabler:map-pin-star', 'tabler:map-pin-heart', 'tabler:map-pin-x', 'tabler:map-pin-question',
    'tabler:map', 'tabler:map-2', 'tabler:map-search', 'tabler:compass', 'tabler:compass-filled',
    'tabler:world', 'tabler:world-latitude', 'tabler:world-longitude', 'tabler:globe', 'tabler:planet',
    'tabler:flag', 'tabler:flag-filled', 'tabler:flag-2', 'tabler:flag-2-filled', 'tabler:flag-3', 'tabler:flag-3-filled',
    'tabler:navigation', 'tabler:navigation-filled', 'tabler:location', 'tabler:location-filled', 'tabler:current-location',
    'tabler:road', 'tabler:route', 'tabler:route-2', 'tabler:gps', 'tabler:radar', 'tabler:radar-2',
    // 住宿
    'tabler:bed', 'tabler:bed-filled', 'tabler:bed-flat', 'tabler:bunk-bed', 'tabler:bunk-bed-filled',
    'tabler:home', 'tabler:home-2', 'tabler:home-filled', 'tabler:home-check', 'tabler:home-heart', 'tabler:home-star',
    'tabler:building', 'tabler:building-skyscraper', 'tabler:building-castle', 'tabler:building-church',
    'tabler:building-hospital', 'tabler:building-store', 'tabler:building-warehouse', 'tabler:building-factory',
    'tabler:tent', 'tabler:tent-filled', 'tabler:teepee', 'tabler:camper', 'tabler:caravan',
    'tabler:door', 'tabler:door-enter', 'tabler:door-exit', 'tabler:window', 'tabler:fence',
    // 餐飲
    'tabler:tools-kitchen-2', 'tabler:tools-kitchen', 'tabler:chef-hat', 'tabler:chef-hat-off', 'tabler:grill',
    'tabler:soup', 'tabler:soup-filled', 'tabler:soup-off', 'tabler:meat', 'tabler:meat-off', 'tabler:salad',
    'tabler:coffee', 'tabler:coffee-filled', 'tabler:coffee-off', 'tabler:tea', 'tabler:tea-filled', 'tabler:teapot',
    'tabler:beer', 'tabler:beer-filled', 'tabler:beer-off', 'tabler:glass', 'tabler:glass-filled', 'tabler:glass-champagne',
    'tabler:bottle', 'tabler:bottle-filled', 'tabler:bottle-off', 'tabler:wine', 'tabler:whiskey',
    'tabler:ice-cream', 'tabler:ice-cream-2', 'tabler:ice-cream-off', 'tabler:lollipop', 'tabler:lollipop-off',
    'tabler:cookie', 'tabler:cookie-filled', 'tabler:cookie-man', 'tabler:candy', 'tabler:candy-off',
    'tabler:pizza', 'tabler:pizza-filled', 'tabler:pizza-off', 'tabler:burger', 'tabler:hot-dog',
    'tabler:bread', 'tabler:bread-filled', 'tabler:bread-off', 'tabler:cheese', 'tabler:egg', 'tabler:egg-filled',
    'tabler:apple', 'tabler:cherry', 'tabler:lemon', 'tabler:strawberry', 'tabler:mushroom', 'tabler:carrot',
    // 景點
    'tabler:beach', 'tabler:mountain', 'tabler:mountain-filled', 'tabler:mountains', 'tabler:volcano',
    'tabler:trees', 'tabler:tree', 'tabler:christmas-tree', 'tabler:christmas-tree-filled', 'tabler:plant', 'tabler:plant-2',
    'tabler:flower', 'tabler:flower-filled', 'tabler:flower-off', 'tabler:cactus', 'tabler:cactus-filled', 'tabler:cactus-off',
    'tabler:leaf', 'tabler:leaf-filled', 'tabler:leaf-off', 'tabler:seeding', 'tabler:seeding-filled', 'tabler:seeding-off',
    'tabler:fish', 'tabler:fish-bone', 'tabler:fish-hook', 'tabler:feather', 'tabler:feather-filled', 'tabler:feather-off',
    'tabler:fountain', 'tabler:fountain-filled', 'tabler:fountain-off', 'tabler:pool', 'tabler:swimming',
    'tabler:ripple', 'tabler:wave-sine', 'tabler:wave-square', 'tabler:wave-saw-tool',
    // 天氣
    'tabler:sun', 'tabler:sun-filled', 'tabler:sun-high', 'tabler:sun-low', 'tabler:sun-off', 'tabler:sunrise', 'tabler:sunset',
    'tabler:cloud', 'tabler:cloud-filled', 'tabler:cloud-off', 'tabler:cloud-rain', 'tabler:cloud-storm', 'tabler:cloud-snow',
    'tabler:cloud-fog', 'tabler:mist', 'tabler:fog', 'tabler:haze', 'tabler:smog',
    'tabler:snowflake', 'tabler:snowflake-off', 'tabler:snowman', 'tabler:wind', 'tabler:wind-off', 'tabler:tornado',
    'tabler:umbrella', 'tabler:umbrella-filled', 'tabler:umbrella-off', 'tabler:temperature', 'tabler:temperature-minus', 'tabler:temperature-plus',
    'tabler:moon', 'tabler:moon-filled', 'tabler:moon-2', 'tabler:moon-stars', 'tabler:stars', 'tabler:stars-filled',
    'tabler:rainbow', 'tabler:rainbow-off', 'tabler:bolt', 'tabler:bolt-off', 'tabler:meteor',
    // 時間
    'tabler:calendar', 'tabler:calendar-filled', 'tabler:calendar-event', 'tabler:calendar-plus', 'tabler:calendar-minus',
    'tabler:calendar-check', 'tabler:calendar-x', 'tabler:calendar-time', 'tabler:calendar-stats', 'tabler:calendar-due',
    'tabler:clock', 'tabler:clock-filled', 'tabler:clock-2', 'tabler:clock-hour-4', 'tabler:clock-hour-8', 'tabler:clock-hour-12',
    'tabler:alarm', 'tabler:alarm-filled', 'tabler:alarm-minus', 'tabler:alarm-plus', 'tabler:alarm-snooze',
    'tabler:hourglass', 'tabler:hourglass-filled', 'tabler:hourglass-high', 'tabler:hourglass-low', 'tabler:hourglass-off',
    'tabler:history', 'tabler:history-toggle', 'tabler:stopwatch', 'tabler:24-hours',
    // 通訊
    'tabler:phone', 'tabler:phone-filled', 'tabler:phone-call', 'tabler:phone-incoming', 'tabler:phone-outgoing', 'tabler:phone-off',
    'tabler:mail', 'tabler:mail-filled', 'tabler:mail-opened', 'tabler:mail-forward', 'tabler:mailbox', 'tabler:inbox',
    'tabler:message', 'tabler:message-filled', 'tabler:message-circle', 'tabler:message-2', 'tabler:messages', 'tabler:bubble',
    'tabler:send', 'tabler:send-2', 'tabler:send-off', 'tabler:share', 'tabler:share-2', 'tabler:share-3',
    'tabler:wifi', 'tabler:wifi-off', 'tabler:wifi-0', 'tabler:wifi-1', 'tabler:wifi-2', 'tabler:antenna', 'tabler:antenna-bars-5',
    // 旅遊
    'tabler:passport', 'tabler:id', 'tabler:id-badge', 'tabler:id-badge-2', 'tabler:license', 'tabler:certificate',
    'tabler:briefcase', 'tabler:briefcase-filled', 'tabler:briefcase-2', 'tabler:luggage', 'tabler:luggage-off',
    'tabler:backpack', 'tabler:backpack-off', 'tabler:school-bag', 'tabler:shopping-bag', 'tabler:shopping-bag-check',
    'tabler:camera', 'tabler:camera-filled', 'tabler:camera-plus', 'tabler:camera-selfie', 'tabler:camera-rotate',
    'tabler:photo', 'tabler:photo-filled', 'tabler:photo-plus', 'tabler:photo-off', 'tabler:photo-search',
    'tabler:binoculars', 'tabler:binoculars-filled', 'tabler:telescope', 'tabler:telescope-filled', 'tabler:telescope-off',
    // 購物
    'tabler:shopping-cart', 'tabler:shopping-cart-filled', 'tabler:shopping-cart-plus', 'tabler:shopping-cart-off',
    'tabler:basket', 'tabler:basket-filled', 'tabler:basket-off', 'tabler:basket-plus', 'tabler:basket-check',
    'tabler:gift', 'tabler:gift-filled', 'tabler:gift-card', 'tabler:gift-card-filled',
    'tabler:tag', 'tabler:tag-filled', 'tabler:tag-off', 'tabler:tags', 'tabler:tags-filled', 'tabler:tags-off',
    'tabler:cash', 'tabler:cash-banknote', 'tabler:cash-off', 'tabler:coins', 'tabler:coin', 'tabler:currency-dollar',
    'tabler:credit-card', 'tabler:credit-card-filled', 'tabler:credit-card-off', 'tabler:wallet', 'tabler:wallet-off',
    'tabler:receipt', 'tabler:receipt-2', 'tabler:receipt-off', 'tabler:receipt-refund', 'tabler:receipt-tax',
    // 評價
    'tabler:star', 'tabler:star-filled', 'tabler:star-half', 'tabler:star-half-filled', 'tabler:star-off', 'tabler:stars',
    'tabler:heart', 'tabler:heart-filled', 'tabler:heart-off', 'tabler:heart-broken', 'tabler:hearts', 'tabler:hearts-off',
    'tabler:thumb-up', 'tabler:thumb-up-filled', 'tabler:thumb-up-off', 'tabler:thumb-down', 'tabler:thumb-down-filled',
    'tabler:check', 'tabler:check-filled', 'tabler:circle-check', 'tabler:circle-check-filled', 'tabler:checks',
    'tabler:x', 'tabler:x-filled', 'tabler:circle-x', 'tabler:circle-x-filled', 'tabler:square-x', 'tabler:square-x-filled',
    'tabler:mood-happy', 'tabler:mood-happy-filled', 'tabler:mood-smile', 'tabler:mood-smile-filled', 'tabler:mood-sad', 'tabler:mood-cry',
    // 資訊
    'tabler:info-circle', 'tabler:info-circle-filled', 'tabler:info-square', 'tabler:info-square-filled',
    'tabler:alert-circle', 'tabler:alert-circle-filled', 'tabler:alert-triangle', 'tabler:alert-triangle-filled',
    'tabler:help', 'tabler:help-circle', 'tabler:help-circle-filled', 'tabler:help-square', 'tabler:help-square-filled',
    'tabler:bulb', 'tabler:bulb-filled', 'tabler:bulb-off', 'tabler:lamp', 'tabler:lamp-2',
    'tabler:bell', 'tabler:bell-filled', 'tabler:bell-ringing', 'tabler:bell-ringing-filled', 'tabler:bell-off',
    'tabler:bookmark', 'tabler:bookmark-filled', 'tabler:bookmark-off', 'tabler:bookmarks', 'tabler:bookmarks-filled',
    'tabler:pin', 'tabler:pin-filled', 'tabler:pinned', 'tabler:pinned-filled', 'tabler:pinned-off',
    // 設施
    'tabler:parking', 'tabler:parking-circle', 'tabler:parking-circle-filled', 'tabler:parking-off',
    'tabler:gas-station', 'tabler:gas-station-off', 'tabler:charging-pile', 'tabler:plug',
    'tabler:toilet-paper', 'tabler:bath', 'tabler:bath-filled', 'tabler:bath-off', 'tabler:shower',
    'tabler:wheelchair', 'tabler:wheelchair-off', 'tabler:disabled', 'tabler:disabled-2', 'tabler:disabled-off',
    'tabler:smoking', 'tabler:smoking-no', 'tabler:bottle', 'tabler:bottle-off',
    'tabler:air-conditioning', 'tabler:air-conditioning-disabled', 'tabler:fan', 'tabler:fan-off',
    'tabler:device-tv', 'tabler:device-tv-old', 'tabler:plug-connected', 'tabler:plug-connected-x',
    // 人物
    'tabler:user', 'tabler:user-filled', 'tabler:user-circle', 'tabler:user-check', 'tabler:user-plus', 'tabler:user-minus',
    'tabler:users', 'tabler:users-group', 'tabler:users-plus', 'tabler:users-minus',
    'tabler:friends', 'tabler:friends-off', 'tabler:man', 'tabler:woman', 'tabler:gender-male', 'tabler:gender-female',
    'tabler:baby-carriage', 'tabler:stroller', 'tabler:run', 'tabler:walk', 'tabler:yoga',
    // 箭頭
    'tabler:arrow-up', 'tabler:arrow-down', 'tabler:arrow-left', 'tabler:arrow-right',
    'tabler:arrow-up-circle', 'tabler:arrow-down-circle', 'tabler:arrow-left-circle', 'tabler:arrow-right-circle',
    'tabler:arrows-up', 'tabler:arrows-down', 'tabler:arrows-left', 'tabler:arrows-right',
    'tabler:chevron-up', 'tabler:chevron-down', 'tabler:chevron-left', 'tabler:chevron-right',
    'tabler:chevrons-up', 'tabler:chevrons-down', 'tabler:chevrons-left', 'tabler:chevrons-right',
    'tabler:arrow-back', 'tabler:arrow-forward', 'tabler:refresh', 'tabler:rotate', 'tabler:switch-horizontal', 'tabler:switch-vertical',
    // 數字符號
    'tabler:circle-1', 'tabler:circle-2', 'tabler:circle-3', 'tabler:circle-4', 'tabler:circle-5',
    'tabler:circle-6', 'tabler:circle-7', 'tabler:circle-8', 'tabler:circle-9', 'tabler:circle-0',
    'tabler:square-1', 'tabler:square-2', 'tabler:square-3', 'tabler:square-4', 'tabler:square-5',
    'tabler:circle-letter-a', 'tabler:circle-letter-b', 'tabler:circle-letter-c', 'tabler:circle-letter-d', 'tabler:circle-letter-e',
    'tabler:plus', 'tabler:minus', 'tabler:x', 'tabler:equal', 'tabler:divide', 'tabler:percentage',
    'tabler:circle', 'tabler:circle-filled', 'tabler:square', 'tabler:square-filled', 'tabler:triangle', 'tabler:triangle-filled',
    'tabler:hexagon', 'tabler:hexagon-filled', 'tabler:pentagon', 'tabler:pentagon-filled', 'tabler:octagon', 'tabler:octagon-filled',
  ],

  ph: [
    // 交通
    'ph:airplane', 'ph:airplane-fill', 'ph:airplane-takeoff', 'ph:airplane-takeoff-fill', 'ph:airplane-landing', 'ph:airplane-landing-fill',
    'ph:airplane-in-flight', 'ph:airplane-in-flight-fill', 'ph:airplane-tilt', 'ph:airplane-tilt-fill',
    'ph:bus', 'ph:bus-fill', 'ph:train', 'ph:train-fill', 'ph:train-simple', 'ph:train-simple-fill',
    'ph:car', 'ph:car-fill', 'ph:car-simple', 'ph:car-simple-fill', 'ph:jeep', 'ph:jeep-fill',
    'ph:boat', 'ph:boat-fill', 'ph:sailboat', 'ph:sailboat-fill', 'ph:anchor', 'ph:anchor-fill', 'ph:anchor-simple', 'ph:anchor-simple-fill',
    'ph:person-simple-walk', 'ph:person-simple-run', 'ph:person-simple-bike', 'ph:person-simple-swim',
    'ph:bicycle', 'ph:bicycle-fill', 'ph:motorcycle', 'ph:motorcycle-fill', 'ph:moped', 'ph:moped-fill', 'ph:moped-front', 'ph:moped-front-fill',
    'ph:taxi', 'ph:taxi-fill', 'ph:subway', 'ph:subway-fill', 'ph:tram', 'ph:tram-fill',
    'ph:rocket', 'ph:rocket-fill', 'ph:rocket-launch', 'ph:rocket-launch-fill', 'ph:parachute', 'ph:parachute-fill',
    'ph:truck', 'ph:truck-fill', 'ph:van', 'ph:van-fill', 'ph:ambulance', 'ph:ambulance-fill',
    // 地點
    'ph:map-pin', 'ph:map-pin-fill', 'ph:map-pin-line', 'ph:map-pin-line-fill', 'ph:map-pin-simple', 'ph:map-pin-simple-fill',
    'ph:map-pin-plus', 'ph:map-pin-plus-fill', 'ph:map-pin-area', 'ph:map-pin-area-fill',
    'ph:map-trifold', 'ph:map-trifold-fill', 'ph:compass', 'ph:compass-fill', 'ph:compass-tool', 'ph:compass-tool-fill',
    'ph:globe', 'ph:globe-fill', 'ph:globe-simple', 'ph:globe-simple-fill', 'ph:globe-hemisphere-east', 'ph:globe-hemisphere-west',
    'ph:flag', 'ph:flag-fill', 'ph:flag-banner', 'ph:flag-banner-fill', 'ph:flag-pennant', 'ph:flag-pennant-fill',
    'ph:navigation-arrow', 'ph:navigation-arrow-fill', 'ph:signpost', 'ph:signpost-fill', 'ph:sign-in', 'ph:sign-out',
    'ph:path', 'ph:road-horizon', 'ph:road-horizon-fill', 'ph:crosshair', 'ph:crosshair-fill', 'ph:crosshair-simple', 'ph:crosshair-simple-fill',
    // 住宿
    'ph:bed', 'ph:bed-fill', 'ph:couch', 'ph:couch-fill', 'ph:armchair', 'ph:armchair-fill',
    'ph:house', 'ph:house-fill', 'ph:house-simple', 'ph:house-simple-fill', 'ph:house-line', 'ph:house-line-fill',
    'ph:buildings', 'ph:buildings-fill', 'ph:building-office', 'ph:building-office-fill', 'ph:building', 'ph:building-fill',
    'ph:building-apartment', 'ph:building-apartment-fill', 'ph:factory', 'ph:factory-fill',
    'ph:tent', 'ph:tent-fill', 'ph:warehouse', 'ph:warehouse-fill', 'ph:barn', 'ph:barn-fill',
    'ph:door', 'ph:door-fill', 'ph:door-open', 'ph:door-open-fill', 'ph:window', 'ph:window-fill',
    'ph:garage', 'ph:garage-fill', 'ph:fence', 'ph:fence-fill', 'ph:castle-turret', 'ph:castle-turret-fill',
    // 餐飲
    'ph:fork-knife', 'ph:fork-knife-fill', 'ph:knife', 'ph:knife-fill', 'ph:cooking-pot', 'ph:cooking-pot-fill',
    'ph:bowl-food', 'ph:bowl-food-fill', 'ph:bowl-steam', 'ph:bowl-steam-fill', 'ph:oven', 'ph:oven-fill',
    'ph:hamburger', 'ph:hamburger-fill', 'ph:pizza', 'ph:pizza-fill', 'ph:popcorn', 'ph:popcorn-fill',
    'ph:coffee', 'ph:coffee-fill', 'ph:coffee-bean', 'ph:coffee-bean-fill', 'ph:tea', 'ph:tea-fill',
    'ph:beer-bottle', 'ph:beer-bottle-fill', 'ph:beer-stein', 'ph:beer-stein-fill', 'ph:wine', 'ph:wine-fill',
    'ph:martini', 'ph:martini-fill', 'ph:champagne', 'ph:champagne-fill', 'ph:brandy', 'ph:brandy-fill',
    'ph:ice-cream', 'ph:ice-cream-fill', 'ph:cookie', 'ph:cookie-fill', 'ph:cake', 'ph:cake-fill',
    'ph:egg', 'ph:egg-fill', 'ph:egg-crack', 'ph:egg-crack-fill', 'ph:carrot', 'ph:carrot-fill',
    'ph:orange-slice', 'ph:orange-slice-fill', 'ph:apple-logo', 'ph:grains', 'ph:grains-fill', 'ph:grains-slash', 'ph:grains-slash-fill',
    // 景點
    'ph:beach-ball', 'ph:beach-ball-fill', 'ph:umbrella-simple', 'ph:umbrella-simple-fill',
    'ph:mountains', 'ph:mountains-fill', 'ph:mountain', 'ph:mountain-fill',
    'ph:tree', 'ph:tree-fill', 'ph:tree-evergreen', 'ph:tree-evergreen-fill', 'ph:tree-palm', 'ph:tree-palm-fill',
    'ph:plant', 'ph:plant-fill', 'ph:potted-plant', 'ph:potted-plant-fill', 'ph:cactus', 'ph:cactus-fill',
    'ph:flower', 'ph:flower-fill', 'ph:flower-lotus', 'ph:flower-lotus-fill', 'ph:flower-tulip', 'ph:flower-tulip-fill',
    'ph:leaf', 'ph:leaf-fill', 'ph:clover', 'ph:clover-fill', 'ph:shamrock', 'ph:shamrock-fill',
    'ph:fish', 'ph:fish-fill', 'ph:fish-simple', 'ph:fish-simple-fill', 'ph:shrimp', 'ph:shrimp-fill',
    'ph:butterfly', 'ph:butterfly-fill', 'ph:bird', 'ph:bird-fill', 'ph:bee', 'ph:bee-fill',
    'ph:cat', 'ph:cat-fill', 'ph:dog', 'ph:dog-fill', 'ph:paw-print', 'ph:paw-print-fill',
    'ph:horse', 'ph:horse-fill', 'ph:rabbit', 'ph:rabbit-fill',
    // 天氣
    'ph:sun', 'ph:sun-fill', 'ph:sun-dim', 'ph:sun-dim-fill', 'ph:sun-horizon', 'ph:sun-horizon-fill',
    'ph:cloud', 'ph:cloud-fill', 'ph:cloud-sun', 'ph:cloud-sun-fill', 'ph:cloud-moon', 'ph:cloud-moon-fill',
    'ph:cloud-rain', 'ph:cloud-rain-fill', 'ph:cloud-snow', 'ph:cloud-snow-fill', 'ph:cloud-lightning', 'ph:cloud-lightning-fill',
    'ph:cloud-fog', 'ph:cloud-fog-fill', 'ph:cloud-arrow-up', 'ph:cloud-arrow-up-fill', 'ph:cloud-arrow-down', 'ph:cloud-arrow-down-fill',
    'ph:snowflake', 'ph:snowflake-fill', 'ph:wind', 'ph:wind-fill', 'ph:tornado', 'ph:tornado-fill',
    'ph:umbrella', 'ph:umbrella-fill', 'ph:drop', 'ph:drop-fill', 'ph:drop-half', 'ph:drop-half-fill',
    'ph:thermometer', 'ph:thermometer-fill', 'ph:thermometer-hot', 'ph:thermometer-hot-fill', 'ph:thermometer-cold', 'ph:thermometer-cold-fill',
    'ph:moon', 'ph:moon-fill', 'ph:moon-stars', 'ph:moon-stars-fill', 'ph:star', 'ph:star-fill',
    'ph:rainbow', 'ph:rainbow-fill', 'ph:rainbow-cloud', 'ph:rainbow-cloud-fill',
    // 時間
    'ph:calendar', 'ph:calendar-fill', 'ph:calendar-blank', 'ph:calendar-blank-fill', 'ph:calendar-plus', 'ph:calendar-plus-fill',
    'ph:calendar-check', 'ph:calendar-check-fill', 'ph:calendar-x', 'ph:calendar-x-fill', 'ph:calendar-heart', 'ph:calendar-heart-fill',
    'ph:clock', 'ph:clock-fill', 'ph:clock-afternoon', 'ph:clock-afternoon-fill', 'ph:clock-countdown', 'ph:clock-countdown-fill',
    'ph:alarm', 'ph:alarm-fill', 'ph:timer', 'ph:timer-fill', 'ph:stopwatch', 'ph:stopwatch-fill',
    'ph:hourglass', 'ph:hourglass-fill', 'ph:hourglass-high', 'ph:hourglass-high-fill', 'ph:hourglass-low', 'ph:hourglass-low-fill',
    // 通訊
    'ph:phone', 'ph:phone-fill', 'ph:phone-call', 'ph:phone-call-fill', 'ph:phone-incoming', 'ph:phone-incoming-fill',
    'ph:phone-outgoing', 'ph:phone-outgoing-fill', 'ph:phone-plus', 'ph:phone-plus-fill',
    'ph:envelope', 'ph:envelope-fill', 'ph:envelope-open', 'ph:envelope-open-fill', 'ph:envelope-simple', 'ph:envelope-simple-fill',
    'ph:chat-circle', 'ph:chat-circle-fill', 'ph:chat-circle-text', 'ph:chat-circle-text-fill',
    'ph:chats', 'ph:chats-fill', 'ph:chats-circle', 'ph:chats-circle-fill',
    'ph:paper-plane-tilt', 'ph:paper-plane-tilt-fill', 'ph:paper-plane', 'ph:paper-plane-fill', 'ph:paper-plane-right', 'ph:paper-plane-right-fill',
    'ph:wifi-high', 'ph:wifi-high-fill', 'ph:wifi-medium', 'ph:wifi-medium-fill', 'ph:wifi-low', 'ph:wifi-low-fill', 'ph:wifi-none', 'ph:wifi-slash',
    // 旅遊
    'ph:identification-card', 'ph:identification-card-fill', 'ph:identification-badge', 'ph:identification-badge-fill',
    'ph:briefcase', 'ph:briefcase-fill', 'ph:briefcase-metal', 'ph:briefcase-metal-fill',
    'ph:suitcase', 'ph:suitcase-fill', 'ph:suitcase-rolling', 'ph:suitcase-rolling-fill', 'ph:suitcase-simple', 'ph:suitcase-simple-fill',
    'ph:backpack', 'ph:backpack-fill', 'ph:bag', 'ph:bag-fill', 'ph:bag-simple', 'ph:bag-simple-fill',
    'ph:camera', 'ph:camera-fill', 'ph:camera-plus', 'ph:camera-plus-fill', 'ph:camera-rotate', 'ph:camera-rotate-fill',
    'ph:image', 'ph:image-fill', 'ph:image-square', 'ph:image-square-fill', 'ph:images', 'ph:images-fill',
    'ph:binoculars', 'ph:binoculars-fill', 'ph:magnifying-glass', 'ph:magnifying-glass-fill', 'ph:magnifying-glass-plus', 'ph:magnifying-glass-plus-fill',
    // 購物
    'ph:shopping-cart', 'ph:shopping-cart-fill', 'ph:shopping-cart-simple', 'ph:shopping-cart-simple-fill',
    'ph:bag', 'ph:bag-fill', 'ph:handbag', 'ph:handbag-fill', 'ph:handbag-simple', 'ph:handbag-simple-fill',
    'ph:gift', 'ph:gift-fill', 'ph:package', 'ph:package-fill', 'ph:storefront', 'ph:storefront-fill',
    'ph:tag', 'ph:tag-fill', 'ph:tag-simple', 'ph:tag-simple-fill', 'ph:barcode', 'ph:barcode-fill',
    'ph:money', 'ph:money-fill', 'ph:currency-circle-dollar', 'ph:currency-circle-dollar-fill', 'ph:coins', 'ph:coins-fill',
    'ph:credit-card', 'ph:credit-card-fill', 'ph:wallet', 'ph:wallet-fill', 'ph:piggy-bank', 'ph:piggy-bank-fill',
    'ph:receipt', 'ph:receipt-fill', 'ph:receipt-x', 'ph:receipt-x-fill',
    // 評價
    'ph:star', 'ph:star-fill', 'ph:star-half', 'ph:star-half-fill', 'ph:star-four', 'ph:star-four-fill',
    'ph:heart', 'ph:heart-fill', 'ph:heart-half', 'ph:heart-half-fill', 'ph:heart-break', 'ph:heart-break-fill',
    'ph:thumbs-up', 'ph:thumbs-up-fill', 'ph:thumbs-down', 'ph:thumbs-down-fill',
    'ph:check', 'ph:check-fill', 'ph:check-circle', 'ph:check-circle-fill', 'ph:check-square', 'ph:check-square-fill',
    'ph:x', 'ph:x-fill', 'ph:x-circle', 'ph:x-circle-fill', 'ph:x-square', 'ph:x-square-fill',
    'ph:smiley', 'ph:smiley-fill', 'ph:smiley-sad', 'ph:smiley-sad-fill', 'ph:smiley-meh', 'ph:smiley-meh-fill',
    'ph:smiley-wink', 'ph:smiley-wink-fill', 'ph:smiley-sticker', 'ph:smiley-sticker-fill',
    // 資訊
    'ph:info', 'ph:info-fill', 'ph:question', 'ph:question-fill', 'ph:question-mark',
    'ph:warning', 'ph:warning-fill', 'ph:warning-circle', 'ph:warning-circle-fill', 'ph:warning-diamond', 'ph:warning-diamond-fill',
    'ph:lightbulb', 'ph:lightbulb-fill', 'ph:lightbulb-filament', 'ph:lightbulb-filament-fill',
    'ph:bell', 'ph:bell-fill', 'ph:bell-ringing', 'ph:bell-ringing-fill', 'ph:bell-simple', 'ph:bell-simple-fill',
    'ph:bookmark', 'ph:bookmark-fill', 'ph:bookmark-simple', 'ph:bookmark-simple-fill', 'ph:bookmarks', 'ph:bookmarks-fill',
    'ph:push-pin', 'ph:push-pin-fill', 'ph:push-pin-simple', 'ph:push-pin-simple-fill',
    // 設施
    'ph:toilet', 'ph:toilet-fill', 'ph:toilet-paper', 'ph:toilet-paper-fill', 'ph:bathtub', 'ph:bathtub-fill', 'ph:shower', 'ph:shower-fill',
    'ph:wheelchair', 'ph:wheelchair-fill', 'ph:wheelchair-motion', 'ph:wheelchair-motion-fill',
    'ph:baby', 'ph:baby-fill', 'ph:baby-carriage', 'ph:baby-carriage-fill',
    'ph:first-aid', 'ph:first-aid-fill', 'ph:first-aid-kit', 'ph:first-aid-kit-fill',
    'ph:fire', 'ph:fire-fill', 'ph:fire-extinguisher', 'ph:fire-extinguisher-fill',
    'ph:plug', 'ph:plug-fill', 'ph:plugs', 'ph:plugs-fill', 'ph:plugs-connected', 'ph:plugs-connected-fill',
    // 人物
    'ph:user', 'ph:user-fill', 'ph:user-circle', 'ph:user-circle-fill', 'ph:user-plus', 'ph:user-plus-fill',
    'ph:users', 'ph:users-fill', 'ph:users-three', 'ph:users-three-fill', 'ph:users-four', 'ph:users-four-fill',
    'ph:hand-waving', 'ph:hand-waving-fill', 'ph:hands-clapping', 'ph:hands-clapping-fill', 'ph:handshake', 'ph:handshake-fill',
    'ph:person', 'ph:person-fill', 'ph:person-simple', 'ph:person-simple-fill', 'ph:person-arms-spread', 'ph:person-arms-spread-fill',
    // 箭頭
    'ph:arrow-up', 'ph:arrow-up-fill', 'ph:arrow-down', 'ph:arrow-down-fill', 'ph:arrow-left', 'ph:arrow-left-fill', 'ph:arrow-right', 'ph:arrow-right-fill',
    'ph:arrow-circle-up', 'ph:arrow-circle-up-fill', 'ph:arrow-circle-down', 'ph:arrow-circle-down-fill',
    'ph:arrow-circle-left', 'ph:arrow-circle-left-fill', 'ph:arrow-circle-right', 'ph:arrow-circle-right-fill',
    'ph:caret-up', 'ph:caret-up-fill', 'ph:caret-down', 'ph:caret-down-fill', 'ph:caret-left', 'ph:caret-left-fill', 'ph:caret-right', 'ph:caret-right-fill',
    'ph:caret-double-up', 'ph:caret-double-down', 'ph:caret-double-left', 'ph:caret-double-right',
    'ph:arrows-clockwise', 'ph:arrows-clockwise-fill', 'ph:arrows-counter-clockwise', 'ph:arrows-counter-clockwise-fill',
    // 數字符號
    'ph:number-circle-one', 'ph:number-circle-one-fill', 'ph:number-circle-two', 'ph:number-circle-two-fill',
    'ph:number-circle-three', 'ph:number-circle-three-fill', 'ph:number-circle-four', 'ph:number-circle-four-fill',
    'ph:number-circle-five', 'ph:number-circle-five-fill', 'ph:number-circle-six', 'ph:number-circle-six-fill',
    'ph:number-circle-seven', 'ph:number-circle-seven-fill', 'ph:number-circle-eight', 'ph:number-circle-eight-fill',
    'ph:number-circle-nine', 'ph:number-circle-nine-fill', 'ph:number-circle-zero', 'ph:number-circle-zero-fill',
    'ph:plus', 'ph:plus-fill', 'ph:minus', 'ph:minus-fill', 'ph:equals', 'ph:equals-fill', 'ph:percent', 'ph:percent-fill',
    'ph:circle', 'ph:circle-fill', 'ph:square', 'ph:square-fill', 'ph:triangle', 'ph:triangle-fill',
    'ph:hexagon', 'ph:hexagon-fill', 'ph:pentagon', 'ph:pentagon-fill', 'ph:octagon', 'ph:octagon-fill',
  ],

  lucide: [
    // 交通
    'lucide:plane', 'lucide:plane-takeoff', 'lucide:plane-landing', 'lucide:send-horizontal',
    'lucide:bus', 'lucide:bus-front', 'lucide:train-front', 'lucide:train-track', 'lucide:tram-front',
    'lucide:car', 'lucide:car-front', 'lucide:car-taxi-front', 'lucide:truck',
    'lucide:ship', 'lucide:sailboat', 'lucide:anchor', 'lucide:ship-wheel',
    'lucide:footprints', 'lucide:bike', 'lucide:rocket', 'lucide:cable-car',
    'lucide:ambulance', 'lucide:forklift', 'lucide:tractor', 'lucide:caravan',
    // 地點
    'lucide:map-pin', 'lucide:map-pin-off', 'lucide:map-pin-check', 'lucide:map-pin-plus', 'lucide:map-pin-x',
    'lucide:map', 'lucide:map-pinned', 'lucide:compass', 'lucide:globe', 'lucide:globe-2',
    'lucide:flag', 'lucide:flag-off', 'lucide:flag-triangle-left', 'lucide:flag-triangle-right',
    'lucide:navigation', 'lucide:navigation-2', 'lucide:navigation-off', 'lucide:locate', 'lucide:locate-fixed', 'lucide:locate-off',
    'lucide:crosshair', 'lucide:target', 'lucide:radar', 'lucide:signpost', 'lucide:signpost-big', 'lucide:milestone',
    // 住宿
    'lucide:bed', 'lucide:bed-double', 'lucide:bed-single', 'lucide:lamp', 'lucide:lamp-desk', 'lucide:lamp-floor',
    'lucide:home', 'lucide:house', 'lucide:house-plus', 'lucide:warehouse', 'lucide:factory',
    'lucide:building', 'lucide:building-2', 'lucide:hotel', 'lucide:school', 'lucide:school-2',
    'lucide:tent', 'lucide:tent-tree', 'lucide:castle', 'lucide:church', 'lucide:landmark',
    'lucide:door-closed', 'lucide:door-open', 'lucide:fence', 'lucide:bath', 'lucide:shower-head',
    // 餐飲
    'lucide:utensils', 'lucide:utensils-crossed', 'lucide:cooking-pot', 'lucide:chef-hat', 'lucide:microwave',
    'lucide:soup', 'lucide:salad', 'lucide:sandwich', 'lucide:pizza', 'lucide:popcorn', 'lucide:drumstick',
    'lucide:coffee', 'lucide:cup-soda', 'lucide:beer', 'lucide:wine', 'lucide:wine-off', 'lucide:martini',
    'lucide:glass-water', 'lucide:milk', 'lucide:milk-off',
    'lucide:ice-cream-cone', 'lucide:ice-cream-bowl', 'lucide:cookie', 'lucide:cake', 'lucide:cake-slice', 'lucide:candy', 'lucide:candy-cane', 'lucide:candy-off',
    'lucide:egg', 'lucide:egg-fried', 'lucide:egg-off', 'lucide:apple', 'lucide:banana', 'lucide:cherry', 'lucide:citrus', 'lucide:grape',
    'lucide:carrot', 'lucide:nut', 'lucide:wheat', 'lucide:wheat-off', 'lucide:beef', 'lucide:ham', 'lucide:bacon',
    // 景點
    'lucide:palm-tree', 'lucide:tree-deciduous', 'lucide:tree-pine', 'lucide:trees', 'lucide:shrub', 'lucide:sprout',
    'lucide:mountain', 'lucide:mountain-snow', 'lucide:sunrise', 'lucide:sunset',
    'lucide:flower', 'lucide:flower-2', 'lucide:clover', 'lucide:leaf', 'lucide:vegan',
    'lucide:fish', 'lucide:fish-off', 'lucide:fish-symbol', 'lucide:bird', 'lucide:bug', 'lucide:snail', 'lucide:turtle', 'lucide:rabbit', 'lucide:squirrel', 'lucide:rat',
    'lucide:cat', 'lucide:dog', 'lucide:paw-print', 'lucide:bone', 'lucide:feather',
    'lucide:waves', 'lucide:droplet', 'lucide:droplets', 'lucide:flame', 'lucide:flame-kindling',
    // 天氣
    'lucide:sun', 'lucide:sun-dim', 'lucide:sun-medium', 'lucide:sun-moon', 'lucide:sun-snow',
    'lucide:moon', 'lucide:moon-star', 'lucide:star', 'lucide:sparkle', 'lucide:sparkles',
    'lucide:cloud', 'lucide:cloud-cog', 'lucide:cloud-drizzle', 'lucide:cloud-fog', 'lucide:cloud-hail',
    'lucide:cloud-lightning', 'lucide:cloud-moon', 'lucide:cloud-moon-rain', 'lucide:cloud-off', 'lucide:cloud-rain', 'lucide:cloud-rain-wind',
    'lucide:cloud-snow', 'lucide:cloud-sun', 'lucide:cloud-sun-rain', 'lucide:cloudy',
    'lucide:snowflake', 'lucide:wind', 'lucide:tornado', 'lucide:rainbow', 'lucide:haze',
    'lucide:umbrella', 'lucide:umbrella-off', 'lucide:thermometer', 'lucide:thermometer-snowflake', 'lucide:thermometer-sun',
    // 時間
    'lucide:calendar', 'lucide:calendar-check', 'lucide:calendar-check-2', 'lucide:calendar-clock', 'lucide:calendar-days',
    'lucide:calendar-heart', 'lucide:calendar-minus', 'lucide:calendar-off', 'lucide:calendar-plus', 'lucide:calendar-range',
    'lucide:calendar-search', 'lucide:calendar-x', 'lucide:calendar-x-2',
    'lucide:clock', 'lucide:clock-1', 'lucide:clock-2', 'lucide:clock-3', 'lucide:clock-4', 'lucide:clock-5', 'lucide:clock-6',
    'lucide:alarm-clock', 'lucide:alarm-clock-check', 'lucide:alarm-clock-minus', 'lucide:alarm-clock-off', 'lucide:alarm-clock-plus',
    'lucide:hourglass', 'lucide:timer', 'lucide:timer-off', 'lucide:timer-reset', 'lucide:stopwatch', 'lucide:history',
    // 通訊
    'lucide:phone', 'lucide:phone-call', 'lucide:phone-forwarded', 'lucide:phone-incoming', 'lucide:phone-missed', 'lucide:phone-off', 'lucide:phone-outgoing',
    'lucide:smartphone', 'lucide:smartphone-charging', 'lucide:smartphone-nfc', 'lucide:tablet', 'lucide:tablet-smartphone',
    'lucide:mail', 'lucide:mail-check', 'lucide:mail-minus', 'lucide:mail-open', 'lucide:mail-plus', 'lucide:mail-question', 'lucide:mail-search', 'lucide:mail-warning', 'lucide:mail-x',
    'lucide:mailbox', 'lucide:inbox', 'lucide:at-sign', 'lucide:send', 'lucide:reply', 'lucide:reply-all', 'lucide:forward',
    'lucide:message-circle', 'lucide:message-circle-more', 'lucide:message-circle-plus', 'lucide:message-square', 'lucide:messages-square',
    'lucide:wifi', 'lucide:wifi-off', 'lucide:signal', 'lucide:signal-high', 'lucide:signal-low', 'lucide:signal-medium', 'lucide:signal-zero',
    // 旅遊
    'lucide:id-card', 'lucide:badge', 'lucide:badge-check', 'lucide:contact', 'lucide:contact-2',
    'lucide:briefcase', 'lucide:briefcase-business', 'lucide:briefcase-medical',
    'lucide:luggage', 'lucide:backpack', 'lucide:school', 'lucide:shopping-bag',
    'lucide:camera', 'lucide:camera-off', 'lucide:video', 'lucide:video-off', 'lucide:aperture', 'lucide:focus',
    'lucide:image', 'lucide:image-off', 'lucide:image-plus', 'lucide:images', 'lucide:gallery-horizontal', 'lucide:gallery-vertical',
    'lucide:binoculars', 'lucide:telescope', 'lucide:flashlight', 'lucide:flashlight-off', 'lucide:glasses', 'lucide:sunglasses',
    'lucide:key', 'lucide:key-round', 'lucide:key-square', 'lucide:lock', 'lucide:lock-keyhole', 'lucide:unlock', 'lucide:unlock-keyhole',
    // 購物
    'lucide:shopping-cart', 'lucide:shopping-basket', 'lucide:shopping-bag',
    'lucide:gift', 'lucide:package', 'lucide:package-check', 'lucide:package-minus', 'lucide:package-open', 'lucide:package-plus', 'lucide:package-search', 'lucide:package-x',
    'lucide:store', 'lucide:storefront', 'lucide:warehouse',
    'lucide:tag', 'lucide:tags', 'lucide:ticket', 'lucide:ticket-check', 'lucide:ticket-minus', 'lucide:ticket-percent', 'lucide:ticket-plus', 'lucide:ticket-slash', 'lucide:ticket-x',
    'lucide:banknote', 'lucide:coins', 'lucide:piggy-bank', 'lucide:dollar-sign', 'lucide:euro', 'lucide:japanese-yen', 'lucide:pound-sterling',
    'lucide:credit-card', 'lucide:wallet', 'lucide:wallet-cards', 'lucide:wallet-minimal',
    'lucide:receipt', 'lucide:receipt-text', 'lucide:barcode', 'lucide:qr-code', 'lucide:scan-barcode', 'lucide:scan-line',
    // 評價
    'lucide:star', 'lucide:star-half', 'lucide:star-off', 'lucide:award', 'lucide:medal', 'lucide:trophy', 'lucide:crown',
    'lucide:heart', 'lucide:heart-crack', 'lucide:heart-handshake', 'lucide:heart-off', 'lucide:heart-pulse',
    'lucide:thumbs-up', 'lucide:thumbs-down', 'lucide:hand-heart',
    'lucide:check', 'lucide:check-check', 'lucide:check-circle', 'lucide:check-circle-2', 'lucide:circle-check', 'lucide:circle-check-big',
    'lucide:x', 'lucide:x-circle', 'lucide:circle-x', 'lucide:ban', 'lucide:slash',
    'lucide:smile', 'lucide:smile-plus', 'lucide:meh', 'lucide:frown', 'lucide:laugh', 'lucide:angry', 'lucide:annoyed',
    // 資訊
    'lucide:info', 'lucide:circle-help', 'lucide:badge-info', 'lucide:badge-help',
    'lucide:alert-circle', 'lucide:alert-octagon', 'lucide:alert-triangle', 'lucide:octagon-alert', 'lucide:triangle-alert',
    'lucide:lightbulb', 'lucide:lightbulb-off', 'lucide:lamp', 'lucide:lamp-ceiling', 'lucide:lamp-desk', 'lucide:lamp-floor', 'lucide:lamp-wall-down', 'lucide:lamp-wall-up',
    'lucide:bell', 'lucide:bell-dot', 'lucide:bell-electric', 'lucide:bell-minus', 'lucide:bell-off', 'lucide:bell-plus', 'lucide:bell-ring',
    'lucide:bookmark', 'lucide:bookmark-check', 'lucide:bookmark-minus', 'lucide:bookmark-plus', 'lucide:bookmark-x', 'lucide:bookmarks',
    'lucide:pin', 'lucide:pin-off', 'lucide:map-pin', 'lucide:map-pinned',
    // 設施
    'lucide:parking-circle', 'lucide:parking-circle-off', 'lucide:parking-meter', 'lucide:parking-square', 'lucide:parking-square-off',
    'lucide:fuel', 'lucide:plug', 'lucide:plug-2', 'lucide:plug-zap', 'lucide:plug-zap-2', 'lucide:unplug',
    'lucide:accessibility', 'lucide:wheelchair',
    'lucide:cigarette', 'lucide:cigarette-off',
    'lucide:baby', 'lucide:dog', 'lucide:cat', 'lucide:paw-print',
    'lucide:hand-helping', 'lucide:helping-hand', 'lucide:handshake',
    'lucide:fire', 'lucide:fire-extinguisher', 'lucide:flame', 'lucide:flame-kindling',
    'lucide:bath', 'lucide:shower-head',
    // 人物
    'lucide:user', 'lucide:user-check', 'lucide:user-cog', 'lucide:user-minus', 'lucide:user-plus', 'lucide:user-round', 'lucide:user-round-check', 'lucide:user-round-cog', 'lucide:user-round-minus', 'lucide:user-round-plus', 'lucide:user-round-search', 'lucide:user-round-x', 'lucide:user-search', 'lucide:user-x',
    'lucide:users', 'lucide:users-round', 'lucide:circle-user', 'lucide:circle-user-round',
    'lucide:smile', 'lucide:frown', 'lucide:meh', 'lucide:laugh', 'lucide:angry',
    'lucide:hand', 'lucide:hand-coins', 'lucide:hand-heart', 'lucide:hand-helping', 'lucide:hand-metal', 'lucide:hand-platter',
    'lucide:handshake', 'lucide:heart-handshake', 'lucide:party-popper', 'lucide:cake',
    // 箭頭
    'lucide:arrow-up', 'lucide:arrow-down', 'lucide:arrow-left', 'lucide:arrow-right',
    'lucide:arrow-up-circle', 'lucide:arrow-down-circle', 'lucide:arrow-left-circle', 'lucide:arrow-right-circle',
    'lucide:arrow-up-left', 'lucide:arrow-up-right', 'lucide:arrow-down-left', 'lucide:arrow-down-right',
    'lucide:arrow-big-up', 'lucide:arrow-big-down', 'lucide:arrow-big-left', 'lucide:arrow-big-right',
    'lucide:chevron-up', 'lucide:chevron-down', 'lucide:chevron-left', 'lucide:chevron-right',
    'lucide:chevrons-up', 'lucide:chevrons-down', 'lucide:chevrons-left', 'lucide:chevrons-right',
    'lucide:circle-arrow-up', 'lucide:circle-arrow-down', 'lucide:circle-arrow-left', 'lucide:circle-arrow-right',
    'lucide:move', 'lucide:move-3d', 'lucide:move-diagonal', 'lucide:move-diagonal-2', 'lucide:move-down', 'lucide:move-down-left', 'lucide:move-down-right', 'lucide:move-horizontal', 'lucide:move-left', 'lucide:move-right', 'lucide:move-up', 'lucide:move-up-left', 'lucide:move-up-right', 'lucide:move-vertical',
    'lucide:redo', 'lucide:redo-2', 'lucide:undo', 'lucide:undo-2', 'lucide:refresh-ccw', 'lucide:refresh-cw', 'lucide:rotate-ccw', 'lucide:rotate-cw',
    // 符號
    'lucide:plus', 'lucide:plus-circle', 'lucide:minus', 'lucide:minus-circle', 'lucide:x', 'lucide:x-circle', 'lucide:divide', 'lucide:divide-circle', 'lucide:equal', 'lucide:equal-not', 'lucide:percent', 'lucide:percent-circle',
    'lucide:circle', 'lucide:circle-dot', 'lucide:circle-dot-dashed', 'lucide:circle-dashed', 'lucide:circle-ellipsis', 'lucide:circle-equal', 'lucide:circle-off',
    'lucide:square', 'lucide:square-asterisk', 'lucide:square-check', 'lucide:square-check-big', 'lucide:square-dashed', 'lucide:square-dot', 'lucide:square-equal', 'lucide:square-minus', 'lucide:square-parking', 'lucide:square-pen', 'lucide:square-percent', 'lucide:square-plus', 'lucide:square-slash', 'lucide:square-stack', 'lucide:square-x',
    'lucide:triangle', 'lucide:triangle-alert', 'lucide:triangle-right',
    'lucide:hexagon', 'lucide:octagon', 'lucide:pentagon', 'lucide:diamond',
  ],

  carbon: [
    // 交通
    'carbon:airplane', 'carbon:flight-international', 'carbon:flight-schedule', 'carbon:flight-roster',
    'carbon:airport-01', 'carbon:airport-02', 'carbon:airport-location',
    'carbon:bus', 'carbon:train', 'carbon:train-speed', 'carbon:train-profile', 'carbon:train-ticket',
    'carbon:car', 'carbon:car-front', 'carbon:van', 'carbon:delivery', 'carbon:delivery-truck',
    'carbon:passenger-ship', 'carbon:sailboat-coastal', 'carbon:sailboat-offshore', 'carbon:ferry',
    'carbon:pedestrian', 'carbon:pedestrian-family', 'carbon:pedestrian-child', 'carbon:person-running',
    'carbon:bicycle', 'carbon:scooter', 'carbon:scooter-front', 'carbon:taxi', 'carbon:rocket',
    'carbon:drone', 'carbon:helicopter', 'carbon:delivery-add',
    // 地點
    'carbon:location', 'carbon:location-filled', 'carbon:location-person', 'carbon:location-person-filled',
    'carbon:location-star', 'carbon:location-star-filled', 'carbon:location-heart', 'carbon:location-heart-filled',
    'carbon:location-save', 'carbon:location-company', 'carbon:location-company-filled',
    'carbon:map', 'carbon:map-boundary', 'carbon:map-boundary-vegetation', 'carbon:map-center', 'carbon:map-identify',
    'carbon:compass', 'carbon:earth', 'carbon:earth-filled', 'carbon:earth-americas', 'carbon:earth-americas-filled',
    'carbon:earth-europe-africa', 'carbon:earth-europe-africa-filled', 'carbon:earth-southeast-asia', 'carbon:earth-southeast-asia-filled',
    'carbon:flag', 'carbon:flag-filled', 'carbon:navigation', 'carbon:road', 'carbon:road-weather',
    // 住宿
    'carbon:hotel', 'carbon:home', 'carbon:campsite', 'carbon:hospital', 'carbon:hospital-bed',
    'carbon:building', 'carbon:building-insights-1', 'carbon:building-insights-2', 'carbon:building-insights-3',
    'carbon:enterprise', 'carbon:industry', 'carbon:factory', 'carbon:store', 'carbon:storefront',
    'carbon:warehouse', 'carbon:garage', 'carbon:door', 'carbon:construction',
    // 餐飲
    'carbon:restaurant', 'carbon:restaurant-fine', 'carbon:noodle-bowl', 'carbon:cafe',
    'carbon:drink-01', 'carbon:drink-02', 'carbon:bar', 'carbon:beer',
    'carbon:coffee', 'carbon:cup-hot', 'carbon:corn',
    'carbon:apple', 'carbon:strawberry', 'carbon:wheat', 'carbon:fish',
    // 景點
    'carbon:tree', 'carbon:tree-fall-risk', 'carbon:tree-view', 'carbon:tree-view-alt',
    'carbon:mountain', 'carbon:park', 'carbon:tropical-storm',
    'carbon:sun', 'carbon:sunrise', 'carbon:sunset', 'carbon:moon', 'carbon:star', 'carbon:star-filled', 'carbon:star-half',
    'carbon:partly-cloudy', 'carbon:partly-cloudy-night',
    'carbon:flower', 'carbon:cactus', 'carbon:sprout',
    'carbon:fish', 'carbon:fish-multiple', 'carbon:butterfly', 'carbon:bee', 'carbon:bee-bat',
    'carbon:cat', 'carbon:dog', 'carbon:paw-print',
    // 天氣
    'carbon:sunny', 'carbon:mostly-sunny', 'carbon:cloud', 'carbon:cloudy',
    'carbon:partly-cloudy', 'carbon:partly-cloudy-night', 'carbon:scattered-showers',
    'carbon:rain', 'carbon:rain-drop', 'carbon:rain-drizzle', 'carbon:rain-heavy',
    'carbon:rain-scattered', 'carbon:rain-scattered-night',
    'carbon:snow', 'carbon:snow-blizzard', 'carbon:snow-heavy', 'carbon:snow-scattered', 'carbon:snow-scattered-night', 'carbon:sleet', 'carbon:hail',
    'carbon:fog', 'carbon:haze', 'carbon:haze-night', 'carbon:smoke', 'carbon:mist',
    'carbon:wind-stream', 'carbon:windy', 'carbon:windy-dust', 'carbon:windy-snow', 'carbon:windy-strong', 'carbon:tornado', 'carbon:hurricane',
    'carbon:temperature', 'carbon:temperature-max', 'carbon:temperature-min', 'carbon:temperature-hot', 'carbon:temperature-frigid', 'carbon:temperature-feels-like',
    'carbon:thunderstorm', 'carbon:thunderstorm-scattered', 'carbon:thunderstorm-severe', 'carbon:lightning',
    'carbon:umbrella', 'carbon:humidity', 'carbon:humidity-alt',
    // 時間
    'carbon:calendar', 'carbon:calendar-add', 'carbon:calendar-heat-map', 'carbon:calendar-settings', 'carbon:calendar-tools',
    'carbon:event', 'carbon:event-schedule', 'carbon:event-change',
    'carbon:time', 'carbon:timer', 'carbon:stopwatch', 'carbon:recently-viewed',
    'carbon:alarm', 'carbon:alarm-add', 'carbon:alarm-subtract',
    'carbon:hourglass', 'carbon:pending',
    // 通訊
    'carbon:phone', 'carbon:phone-block', 'carbon:phone-filled', 'carbon:phone-incoming', 'carbon:phone-incoming-filled',
    'carbon:phone-off', 'carbon:phone-off-filled', 'carbon:phone-outgoing', 'carbon:phone-outgoing-filled',
    'carbon:phone-voice', 'carbon:phone-voice-filled',
    'carbon:mobile', 'carbon:mobile-add', 'carbon:mobile-audio', 'carbon:mobile-check', 'carbon:mobile-download', 'carbon:mobile-event', 'carbon:mobile-landscape', 'carbon:mobile-session', 'carbon:mobile-view', 'carbon:mobile-view-orientation',
    'carbon:email', 'carbon:email-new', 'carbon:send', 'carbon:send-alt', 'carbon:send-alt-filled', 'carbon:send-filled',
    'carbon:chat', 'carbon:chat-bot', 'carbon:chat-launch', 'carbon:chat-off', 'carbon:chat-operational', 'carbon:forum',
    'carbon:wifi', 'carbon:wifi-bridge', 'carbon:wifi-bridge-alt', 'carbon:wifi-controller', 'carbon:wifi-not-secure', 'carbon:wifi-off', 'carbon:wifi-secure',
    // 旅遊
    'carbon:identification', 'carbon:user-identification', 'carbon:passport', 'carbon:id', 'carbon:id-management',
    'carbon:portfolio', 'carbon:briefcase', 'carbon:luggage', 'carbon:backpack',
    'carbon:camera', 'carbon:camera-action', 'carbon:video', 'carbon:video-add', 'carbon:video-filled',
    'carbon:image', 'carbon:image-copy', 'carbon:image-medical', 'carbon:image-reference', 'carbon:image-search', 'carbon:image-service',
    'carbon:binoculars', 'carbon:view', 'carbon:view-filled', 'carbon:view-mode-1', 'carbon:view-mode-2',
    'carbon:key', 'carbon:locked', 'carbon:unlocked', 'carbon:password',
    // 購物
    'carbon:shopping-cart', 'carbon:shopping-cart-arrow-down', 'carbon:shopping-cart-arrow-up',
    'carbon:shopping-cart-clear', 'carbon:shopping-cart-error', 'carbon:shopping-cart-minus', 'carbon:shopping-cart-plus',
    'carbon:shopping-bag', 'carbon:basket',
    'carbon:gift', 'carbon:gift-filled', 'carbon:package', 'carbon:delivery', 'carbon:delivery-truck',
    'carbon:tag', 'carbon:tag-edit', 'carbon:tag-export', 'carbon:tag-group', 'carbon:tag-import', 'carbon:tag-none',
    'carbon:money', 'carbon:currency-dollar', 'carbon:currency-euro', 'carbon:currency-yen', 'carbon:currency-pound',
    'carbon:purchase', 'carbon:wallet', 'carbon:piggy-bank', 'carbon:piggy-bank-slot', 'carbon:finance',
    'carbon:receipt', 'carbon:pricing-traditional', 'carbon:cost', 'carbon:cost-total',
    // 評價
    'carbon:star', 'carbon:star-filled', 'carbon:star-half', 'carbon:star-review',
    'carbon:favorite', 'carbon:favorite-filled', 'carbon:favorite-half',
    'carbon:thumbs-up', 'carbon:thumbs-up-filled', 'carbon:thumbs-down', 'carbon:thumbs-down-filled',
    'carbon:checkmark', 'carbon:checkmark-filled', 'carbon:checkmark-outline', 'carbon:checkmark-outline-error', 'carbon:checkmark-outline-warning',
    'carbon:close', 'carbon:close-filled', 'carbon:close-outline',
    'carbon:face-satisfied', 'carbon:face-satisfied-filled', 'carbon:face-neutral', 'carbon:face-neutral-filled', 'carbon:face-dissatisfied', 'carbon:face-dissatisfied-filled',
    'carbon:face-wink', 'carbon:face-wink-filled', 'carbon:face-activated', 'carbon:face-activated-add', 'carbon:face-activated-filled',
    'carbon:face-cool', 'carbon:face-dizzy', 'carbon:face-dizzy-filled', 'carbon:face-mask', 'carbon:face-pending', 'carbon:face-pending-filled',
    // 資訊
    'carbon:information', 'carbon:information-filled', 'carbon:information-square', 'carbon:information-square-filled',
    'carbon:warning', 'carbon:warning-alt', 'carbon:warning-alt-filled', 'carbon:warning-filled', 'carbon:warning-hex', 'carbon:warning-hex-filled',
    'carbon:warning-other', 'carbon:warning-square', 'carbon:warning-square-filled',
    'carbon:help', 'carbon:help-filled', 'carbon:question', 'carbon:question-filled',
    'carbon:idea', 'carbon:lightbulb', 'carbon:light', 'carbon:light-filled',
    'carbon:notification', 'carbon:notification-filled', 'carbon:notification-new', 'carbon:notification-off', 'carbon:notification-off-filled',
    'carbon:bookmark', 'carbon:bookmark-add', 'carbon:bookmark-filled',
    // 設施
    'carbon:parking', 'carbon:gas-station', 'carbon:gas-station-filled', 'carbon:charging-station', 'carbon:charging-station-filled',
    'carbon:accessibility', 'carbon:accessibility-alt', 'carbon:accessibility-color', 'carbon:accessibility-color-filled',
    'carbon:hospital', 'carbon:hospital-bed', 'carbon:emergency', 'carbon:pills', 'carbon:pills-add', 'carbon:pills-subtract',
    'carbon:fire', 'carbon:fire-alarm', 'carbon:fire-filled', 'carbon:smoke',
    'carbon:elevator', 'carbon:escalator-down', 'carbon:escalator-up',
    'carbon:child-care', 'carbon:pedestrian-child', 'carbon:pedestrian-family',
    'carbon:swimming', 'carbon:pool', 'carbon:gym', 'carbon:spa',
    // 人物
    'carbon:user', 'carbon:user-access', 'carbon:user-activity', 'carbon:user-admin', 'carbon:user-avatar',
    'carbon:user-avatar-filled', 'carbon:user-avatar-filled-alt', 'carbon:user-certification', 'carbon:user-data',
    'carbon:user-favorite', 'carbon:user-favorite-alt', 'carbon:user-favorite-alt-filled', 'carbon:user-filled',
    'carbon:user-follow', 'carbon:user-identification', 'carbon:user-military', 'carbon:user-multiple', 'carbon:user-online',
    'carbon:user-profile', 'carbon:user-profile-alt', 'carbon:user-role', 'carbon:user-service-desk', 'carbon:user-settings',
    'carbon:user-simulation', 'carbon:user-speaker', 'carbon:user-sponsor', 'carbon:user-x-ray',
    'carbon:group', 'carbon:group-access', 'carbon:group-account', 'carbon:group-objects', 'carbon:group-presentation',
    'carbon:person', 'carbon:person-favorite', 'carbon:collaboration', 'carbon:partnership',
    'carbon:face-satisfied', 'carbon:face-neutral', 'carbon:face-dissatisfied', 'carbon:face-wink', 'carbon:face-cool',
    // 箭頭
    'carbon:arrow-up', 'carbon:arrow-down', 'carbon:arrow-left', 'carbon:arrow-right',
    'carbon:arrow-up-left', 'carbon:arrow-up-right', 'carbon:arrow-down-left', 'carbon:arrow-down-right',
    'carbon:arrows-horizontal', 'carbon:arrows-vertical',
    'carbon:chevron-up', 'carbon:chevron-down', 'carbon:chevron-left', 'carbon:chevron-right',
    'carbon:chevron-sort', 'carbon:chevron-sort-down', 'carbon:chevron-sort-up',
    'carbon:up-to-top', 'carbon:down-to-bottom', 'carbon:page-first', 'carbon:page-last',
    'carbon:direction-bear-right-01', 'carbon:direction-bear-right-02', 'carbon:direction-curve',
    'carbon:direction-fork', 'carbon:direction-loop-left', 'carbon:direction-loop-right',
    'carbon:direction-merge', 'carbon:direction-right-01', 'carbon:direction-right-02',
    'carbon:direction-rotary-first-right', 'carbon:direction-rotary-right', 'carbon:direction-rotary-straight',
    'carbon:direction-sharp-turn', 'carbon:direction-straight', 'carbon:direction-straight-filled', 'carbon:direction-straight-right', 'carbon:direction-straight-right-filled',
    'carbon:direction-u-turn', 'carbon:direction-u-turn-filled',
    'carbon:undo', 'carbon:redo', 'carbon:renew', 'carbon:restart', 'carbon:rotate', 'carbon:rotate-clockwise', 'carbon:rotate-clockwise-alt', 'carbon:rotate-clockwise-alt-filled', 'carbon:rotate-clockwise-filled', 'carbon:rotate-counterclockwise', 'carbon:rotate-counterclockwise-alt', 'carbon:rotate-counterclockwise-alt-filled', 'carbon:rotate-counterclockwise-filled',
    // 符號
    'carbon:add', 'carbon:add-alt', 'carbon:add-filled', 'carbon:add-large', 'carbon:subtract', 'carbon:subtract-alt', 'carbon:subtract-filled', 'carbon:subtract-large',
    'carbon:close', 'carbon:close-filled', 'carbon:close-large', 'carbon:close-outline',
    'carbon:circle-filled', 'carbon:circle-outline', 'carbon:circle-packing', 'carbon:circle-solid', 'carbon:circle-stroke',
    'carbon:square-filled', 'carbon:square-outline', 'carbon:triangle-filled', 'carbon:triangle-down-outline', 'carbon:triangle-down-solid',
    'carbon:triangle-left-outline', 'carbon:triangle-left-solid', 'carbon:triangle-right-outline', 'carbon:triangle-right-solid',
    'carbon:triangle-up-outline', 'carbon:triangle-up-solid',
    'carbon:hexagon-filled', 'carbon:hexagon-outline', 'carbon:pentagon-filled', 'carbon:pentagon-outline',
    'carbon:diamond-filled', 'carbon:diamond-outline',
    'carbon:shape-except', 'carbon:shape-intersect', 'carbon:shape-subtract', 'carbon:shape-unite',
  ],

  heroicons: [
    'heroicons:airplane-ticket', 'heroicons:airplane-ticket-solid', 'heroicons:globe-alt', 'heroicons:globe-alt-solid',
    'heroicons:globe-americas', 'heroicons:globe-americas-solid', 'heroicons:globe-asia-australia', 'heroicons:globe-asia-australia-solid',
    'heroicons:map', 'heroicons:map-solid', 'heroicons:map-pin', 'heroicons:map-pin-solid',
    'heroicons:home', 'heroicons:home-solid', 'heroicons:home-modern', 'heroicons:home-modern-solid',
    'heroicons:building-office', 'heroicons:building-office-solid', 'heroicons:building-office-2', 'heroicons:building-office-2-solid',
    'heroicons:building-storefront', 'heroicons:building-storefront-solid', 'heroicons:building-library', 'heroicons:building-library-solid',
    'heroicons:cake', 'heroicons:cake-solid', 'heroicons:gift', 'heroicons:gift-solid', 'heroicons:gift-top', 'heroicons:gift-top-solid',
    'heroicons:sun', 'heroicons:sun-solid', 'heroicons:moon', 'heroicons:moon-solid', 'heroicons:cloud', 'heroicons:cloud-solid',
    'heroicons:fire', 'heroicons:fire-solid', 'heroicons:sparkles', 'heroicons:sparkles-solid',
    'heroicons:calendar', 'heroicons:calendar-solid', 'heroicons:calendar-days', 'heroicons:calendar-days-solid',
    'heroicons:clock', 'heroicons:clock-solid', 'heroicons:phone', 'heroicons:phone-solid',
    'heroicons:envelope', 'heroicons:envelope-solid', 'heroicons:envelope-open', 'heroicons:envelope-open-solid',
    'heroicons:chat-bubble-left', 'heroicons:chat-bubble-left-solid', 'heroicons:chat-bubble-oval-left', 'heroicons:chat-bubble-oval-left-solid',
    'heroicons:wifi', 'heroicons:signal', 'heroicons:signal-solid',
    'heroicons:camera', 'heroicons:camera-solid', 'heroicons:photo', 'heroicons:photo-solid',
    'heroicons:shopping-bag', 'heroicons:shopping-bag-solid', 'heroicons:shopping-cart', 'heroicons:shopping-cart-solid',
    'heroicons:credit-card', 'heroicons:credit-card-solid', 'heroicons:banknotes', 'heroicons:banknotes-solid',
    'heroicons:tag', 'heroicons:tag-solid', 'heroicons:ticket', 'heroicons:ticket-solid',
    'heroicons:star', 'heroicons:star-solid', 'heroicons:heart', 'heroicons:heart-solid',
    'heroicons:hand-thumb-up', 'heroicons:hand-thumb-up-solid', 'heroicons:hand-thumb-down', 'heroicons:hand-thumb-down-solid',
    'heroicons:check', 'heroicons:check-circle', 'heroicons:check-circle-solid', 'heroicons:x-mark', 'heroicons:x-circle', 'heroicons:x-circle-solid',
    'heroicons:face-smile', 'heroicons:face-smile-solid', 'heroicons:face-frown', 'heroicons:face-frown-solid',
    'heroicons:information-circle', 'heroicons:information-circle-solid', 'heroicons:exclamation-circle', 'heroicons:exclamation-circle-solid',
    'heroicons:question-mark-circle', 'heroicons:question-mark-circle-solid', 'heroicons:light-bulb', 'heroicons:light-bulb-solid',
    'heroicons:bell', 'heroicons:bell-solid', 'heroicons:bookmark', 'heroicons:bookmark-solid',
    'heroicons:user', 'heroicons:user-solid', 'heroicons:user-circle', 'heroicons:user-circle-solid',
    'heroicons:user-group', 'heroicons:user-group-solid', 'heroicons:users', 'heroicons:users-solid',
    'heroicons:arrow-up', 'heroicons:arrow-down', 'heroicons:arrow-left', 'heroicons:arrow-right',
    'heroicons:chevron-up', 'heroicons:chevron-down', 'heroicons:chevron-left', 'heroicons:chevron-right',
    'heroicons:plus', 'heroicons:minus', 'heroicons:plus-circle', 'heroicons:plus-circle-solid',
  ],

  bi: [
    'bi:airplane', 'bi:airplane-fill', 'bi:train-front', 'bi:train-front-fill', 'bi:bus-front', 'bi:bus-front-fill',
    'bi:car-front', 'bi:car-front-fill', 'bi:taxi-front', 'bi:taxi-front-fill', 'bi:truck', 'bi:truck-front',
    'bi:bicycle', 'bi:scooter', 'bi:rocket', 'bi:rocket-fill', 'bi:rocket-takeoff', 'bi:rocket-takeoff-fill',
    'bi:geo-alt', 'bi:geo-alt-fill', 'bi:geo', 'bi:geo-fill', 'bi:map', 'bi:map-fill',
    'bi:compass', 'bi:compass-fill', 'bi:globe', 'bi:globe2', 'bi:globe-americas', 'bi:globe-asia-australia',
    'bi:flag', 'bi:flag-fill', 'bi:signpost', 'bi:signpost-2', 'bi:signpost-fill', 'bi:signpost-2-fill',
    'bi:house', 'bi:house-fill', 'bi:house-door', 'bi:house-door-fill', 'bi:building', 'bi:building-fill',
    'bi:buildings', 'bi:buildings-fill', 'bi:shop', 'bi:shop-window',
    'bi:cup-hot', 'bi:cup-hot-fill', 'bi:cup', 'bi:cup-fill', 'bi:cup-straw',
    'bi:egg', 'bi:egg-fill', 'bi:egg-fried',
    'bi:tree', 'bi:tree-fill', 'bi:flower1', 'bi:flower2', 'bi:flower3',
    'bi:sun', 'bi:sun-fill', 'bi:moon', 'bi:moon-fill', 'bi:moon-stars', 'bi:moon-stars-fill',
    'bi:cloud', 'bi:cloud-fill', 'bi:cloud-sun', 'bi:cloud-sun-fill', 'bi:cloud-rain', 'bi:cloud-rain-fill',
    'bi:snow', 'bi:snow2', 'bi:snow3', 'bi:wind', 'bi:lightning', 'bi:lightning-fill',
    'bi:umbrella', 'bi:umbrella-fill', 'bi:thermometer', 'bi:thermometer-half', 'bi:thermometer-high', 'bi:thermometer-low',
    'bi:calendar', 'bi:calendar-fill', 'bi:calendar2', 'bi:calendar2-fill', 'bi:calendar-check', 'bi:calendar-check-fill',
    'bi:clock', 'bi:clock-fill', 'bi:alarm', 'bi:alarm-fill', 'bi:stopwatch', 'bi:stopwatch-fill',
    'bi:telephone', 'bi:telephone-fill', 'bi:phone', 'bi:phone-fill',
    'bi:envelope', 'bi:envelope-fill', 'bi:envelope-open', 'bi:envelope-open-fill',
    'bi:chat', 'bi:chat-fill', 'bi:chat-dots', 'bi:chat-dots-fill', 'bi:send', 'bi:send-fill',
    'bi:wifi', 'bi:wifi-off', 'bi:broadcast', 'bi:broadcast-pin',
    'bi:person-vcard', 'bi:person-vcard-fill', 'bi:briefcase', 'bi:briefcase-fill', 'bi:luggage', 'bi:luggage-fill',
    'bi:backpack', 'bi:backpack-fill', 'bi:camera', 'bi:camera-fill', 'bi:image', 'bi:image-fill',
    'bi:bag', 'bi:bag-fill', 'bi:cart', 'bi:cart-fill', 'bi:basket', 'bi:basket-fill',
    'bi:gift', 'bi:gift-fill', 'bi:tag', 'bi:tag-fill', 'bi:tags', 'bi:tags-fill',
    'bi:cash', 'bi:cash-coin', 'bi:credit-card', 'bi:credit-card-fill', 'bi:wallet', 'bi:wallet-fill',
    'bi:star', 'bi:star-fill', 'bi:star-half', 'bi:heart', 'bi:heart-fill', 'bi:heart-half',
    'bi:hand-thumbs-up', 'bi:hand-thumbs-up-fill', 'bi:hand-thumbs-down', 'bi:hand-thumbs-down-fill',
    'bi:check', 'bi:check-circle', 'bi:check-circle-fill', 'bi:x', 'bi:x-circle', 'bi:x-circle-fill',
    'bi:emoji-smile', 'bi:emoji-smile-fill', 'bi:emoji-frown', 'bi:emoji-frown-fill',
    'bi:info-circle', 'bi:info-circle-fill', 'bi:exclamation-circle', 'bi:exclamation-circle-fill',
    'bi:question-circle', 'bi:question-circle-fill', 'bi:lightbulb', 'bi:lightbulb-fill',
    'bi:bell', 'bi:bell-fill', 'bi:bookmark', 'bi:bookmark-fill', 'bi:pin-map', 'bi:pin-map-fill',
    'bi:person', 'bi:person-fill', 'bi:person-circle', 'bi:people', 'bi:people-fill',
    'bi:arrow-up', 'bi:arrow-down', 'bi:arrow-left', 'bi:arrow-right',
    'bi:chevron-up', 'bi:chevron-down', 'bi:chevron-left', 'bi:chevron-right',
    'bi:plus', 'bi:plus-circle', 'bi:plus-circle-fill', 'bi:dash', 'bi:dash-circle', 'bi:dash-circle-fill',
    'bi:circle', 'bi:circle-fill', 'bi:square', 'bi:square-fill', 'bi:triangle', 'bi:triangle-fill',
  ],

  ri: [
    'ri:plane-line', 'ri:plane-fill', 'ri:flight-takeoff-line', 'ri:flight-takeoff-fill', 'ri:flight-land-line', 'ri:flight-land-fill',
    'ri:bus-line', 'ri:bus-fill', 'ri:train-line', 'ri:train-fill', 'ri:subway-line', 'ri:subway-fill',
    'ri:car-line', 'ri:car-fill', 'ri:taxi-line', 'ri:taxi-fill', 'ri:truck-line', 'ri:truck-fill',
    'ri:ship-line', 'ri:ship-fill', 'ri:sailboat-line', 'ri:sailboat-fill', 'ri:anchor-line', 'ri:anchor-fill',
    'ri:bike-line', 'ri:bike-fill', 'ri:motorbike-line', 'ri:motorbike-fill', 'ri:walk-line', 'ri:walk-fill', 'ri:run-line', 'ri:run-fill',
    'ri:rocket-line', 'ri:rocket-fill', 'ri:rocket-2-line', 'ri:rocket-2-fill',
    'ri:map-pin-line', 'ri:map-pin-fill', 'ri:map-pin-2-line', 'ri:map-pin-2-fill', 'ri:map-pin-add-line', 'ri:map-pin-add-fill',
    'ri:map-2-line', 'ri:map-2-fill', 'ri:compass-line', 'ri:compass-fill', 'ri:compass-3-line', 'ri:compass-3-fill',
    'ri:earth-line', 'ri:earth-fill', 'ri:globe-line', 'ri:globe-fill',
    'ri:flag-line', 'ri:flag-fill', 'ri:flag-2-line', 'ri:flag-2-fill',
    'ri:home-line', 'ri:home-fill', 'ri:home-2-line', 'ri:home-2-fill', 'ri:home-4-line', 'ri:home-4-fill',
    'ri:building-line', 'ri:building-fill', 'ri:building-2-line', 'ri:building-2-fill', 'ri:building-4-line', 'ri:building-4-fill',
    'ri:hotel-line', 'ri:hotel-fill', 'ri:store-line', 'ri:store-fill', 'ri:store-2-line', 'ri:store-2-fill',
    'ri:restaurant-line', 'ri:restaurant-fill', 'ri:restaurant-2-line', 'ri:restaurant-2-fill',
    'ri:cup-line', 'ri:cup-fill', 'ri:goblet-line', 'ri:goblet-fill', 'ri:cake-line', 'ri:cake-fill', 'ri:cake-2-line', 'ri:cake-2-fill',
    'ri:tree-line', 'ri:tree-fill', 'ri:plant-line', 'ri:plant-fill', 'ri:seedling-line', 'ri:seedling-fill', 'ri:leaf-line', 'ri:leaf-fill',
    'ri:sun-line', 'ri:sun-fill', 'ri:moon-line', 'ri:moon-fill', 'ri:sparkling-line', 'ri:sparkling-fill',
    'ri:cloudy-line', 'ri:cloudy-fill', 'ri:cloudy-2-line', 'ri:cloudy-2-fill',
    'ri:rainy-line', 'ri:rainy-fill', 'ri:snowy-line', 'ri:snowy-fill', 'ri:windy-line', 'ri:windy-fill',
    'ri:thunderstorms-line', 'ri:thunderstorms-fill', 'ri:foggy-line', 'ri:foggy-fill',
    'ri:temp-hot-line', 'ri:temp-hot-fill', 'ri:temp-cold-line', 'ri:temp-cold-fill',
    'ri:calendar-line', 'ri:calendar-fill', 'ri:calendar-2-line', 'ri:calendar-2-fill', 'ri:calendar-check-line', 'ri:calendar-check-fill',
    'ri:time-line', 'ri:time-fill', 'ri:timer-line', 'ri:timer-fill', 'ri:alarm-line', 'ri:alarm-fill',
    'ri:phone-line', 'ri:phone-fill', 'ri:smartphone-line', 'ri:smartphone-fill',
    'ri:mail-line', 'ri:mail-fill', 'ri:mail-open-line', 'ri:mail-open-fill', 'ri:send-plane-line', 'ri:send-plane-fill',
    'ri:chat-1-line', 'ri:chat-1-fill', 'ri:chat-3-line', 'ri:chat-3-fill', 'ri:message-2-line', 'ri:message-2-fill',
    'ri:wifi-line', 'ri:wifi-fill', 'ri:signal-tower-line', 'ri:signal-tower-fill',
    'ri:passport-line', 'ri:passport-fill', 'ri:suitcase-line', 'ri:suitcase-fill', 'ri:luggage-cart-line', 'ri:luggage-cart-fill',
    'ri:camera-line', 'ri:camera-fill', 'ri:camera-2-line', 'ri:camera-2-fill', 'ri:image-line', 'ri:image-fill',
    'ri:shopping-bag-line', 'ri:shopping-bag-fill', 'ri:shopping-cart-line', 'ri:shopping-cart-fill',
    'ri:gift-line', 'ri:gift-fill', 'ri:gift-2-line', 'ri:gift-2-fill',
    'ri:price-tag-line', 'ri:price-tag-fill', 'ri:price-tag-3-line', 'ri:price-tag-3-fill',
    'ri:money-dollar-circle-line', 'ri:money-dollar-circle-fill', 'ri:bank-card-line', 'ri:bank-card-fill', 'ri:wallet-line', 'ri:wallet-fill',
    'ri:star-line', 'ri:star-fill', 'ri:star-half-line', 'ri:star-half-fill',
    'ri:heart-line', 'ri:heart-fill', 'ri:heart-2-line', 'ri:heart-2-fill',
    'ri:thumb-up-line', 'ri:thumb-up-fill', 'ri:thumb-down-line', 'ri:thumb-down-fill',
    'ri:check-line', 'ri:check-fill', 'ri:checkbox-circle-line', 'ri:checkbox-circle-fill',
    'ri:close-line', 'ri:close-fill', 'ri:close-circle-line', 'ri:close-circle-fill',
    'ri:emotion-happy-line', 'ri:emotion-happy-fill', 'ri:emotion-unhappy-line', 'ri:emotion-unhappy-fill',
    'ri:information-line', 'ri:information-fill', 'ri:error-warning-line', 'ri:error-warning-fill',
    'ri:question-line', 'ri:question-fill', 'ri:lightbulb-line', 'ri:lightbulb-fill',
    'ri:notification-line', 'ri:notification-fill', 'ri:bookmark-line', 'ri:bookmark-fill',
    'ri:user-line', 'ri:user-fill', 'ri:user-3-line', 'ri:user-3-fill', 'ri:group-line', 'ri:group-fill', 'ri:team-line', 'ri:team-fill',
    'ri:arrow-up-line', 'ri:arrow-down-line', 'ri:arrow-left-line', 'ri:arrow-right-line',
    'ri:add-line', 'ri:add-fill', 'ri:subtract-line', 'ri:subtract-fill',
  ],

  iconoir: [
    'iconoir:airplane', 'iconoir:airplane-helix', 'iconoir:airplane-helix-45deg', 'iconoir:airplane-off', 'iconoir:airplane-rotation',
    'iconoir:bus', 'iconoir:bus-stop', 'iconoir:train', 'iconoir:tram', 'iconoir:metro',
    'iconoir:car', 'iconoir:truck', 'iconoir:delivery-truck', 'iconoir:van',
    'iconoir:sailing', 'iconoir:boat', 'iconoir:fishing', 'iconoir:anchor',
    'iconoir:bicycle', 'iconoir:scooter', 'iconoir:walking', 'iconoir:running', 'iconoir:treadmill',
    'iconoir:rocket', 'iconoir:rocket-2', 'iconoir:parachute',
    'iconoir:pin-alt', 'iconoir:pin', 'iconoir:pin-slash', 'iconoir:map',
    'iconoir:compass', 'iconoir:globe', 'iconoir:internet', 'iconoir:world',
    'iconoir:home', 'iconoir:home-alt', 'iconoir:home-hospital', 'iconoir:home-simple', 'iconoir:home-simple-door',
    'iconoir:building', 'iconoir:city', 'iconoir:community', 'iconoir:church', 'iconoir:church-alt',
    'iconoir:shop', 'iconoir:shop-alt', 'iconoir:shop-window', 'iconoir:garage',
    'iconoir:coffee-cup', 'iconoir:cup', 'iconoir:glass-half', 'iconoir:glass-empty', 'iconoir:wine-glass',
    'iconoir:birthday-cake', 'iconoir:cupcake', 'iconoir:pizza-slice', 'iconoir:apple-half',
    'iconoir:tree', 'iconoir:pine-tree', 'iconoir:leaf', 'iconoir:flower', 'iconoir:grass',
    'iconoir:sun-light', 'iconoir:half-moon', 'iconoir:moon-sat', 'iconoir:sea-waves',
    'iconoir:cloud', 'iconoir:cloud-sunny', 'iconoir:rain', 'iconoir:snow', 'iconoir:wind', 'iconoir:thunderstorm', 'iconoir:fog',
    'iconoir:temperature-high', 'iconoir:temperature-low',
    'iconoir:calendar', 'iconoir:calendar-plus', 'iconoir:calendar-minus', 'iconoir:calendar-check',
    'iconoir:clock', 'iconoir:timer', 'iconoir:alarm', 'iconoir:time-zone', 'iconoir:hourglass',
    'iconoir:phone', 'iconoir:phone-income', 'iconoir:phone-outcome', 'iconoir:phone-disabled',
    'iconoir:mail', 'iconoir:mail-opened', 'iconoir:send', 'iconoir:send-diagonal',
    'iconoir:chat-bubble', 'iconoir:chat-lines', 'iconoir:message', 'iconoir:message-text',
    'iconoir:wifi', 'iconoir:wifi-off', 'iconoir:antenna', 'iconoir:antenna-signal',
    'iconoir:suitcase', 'iconoir:backpack', 'iconoir:camera', 'iconoir:media-image',
    'iconoir:shopping-bag', 'iconoir:cart', 'iconoir:gift', 'iconoir:label',
    'iconoir:credit-card', 'iconoir:wallet', 'iconoir:coin', 'iconoir:cash',
    'iconoir:star', 'iconoir:star-half-dashed', 'iconoir:heart', 'iconoir:heart-alt',
    'iconoir:thumbs-up', 'iconoir:thumbs-down', 'iconoir:check', 'iconoir:check-circle', 'iconoir:xmark', 'iconoir:xmark-circle',
    'iconoir:emoji', 'iconoir:emoji-satisfied', 'iconoir:emoji-sad', 'iconoir:emoji-surprise', 'iconoir:emoji-puzzled',
    'iconoir:info-circle', 'iconoir:warning-circle', 'iconoir:help-circle', 'iconoir:light-bulb',
    'iconoir:bell', 'iconoir:bell-off', 'iconoir:bookmark', 'iconoir:bookmark-solid',
    'iconoir:user', 'iconoir:user-circle', 'iconoir:user-square', 'iconoir:group', 'iconoir:community',
    'iconoir:nav-arrow-up', 'iconoir:nav-arrow-down', 'iconoir:nav-arrow-left', 'iconoir:nav-arrow-right',
    'iconoir:plus', 'iconoir:minus', 'iconoir:plus-circle', 'iconoir:minus-circle',
  ],

  solar: [
    'solar:airplane-bold', 'solar:airplane-linear', 'solar:airplane-broken',
    'solar:bus-bold', 'solar:bus-linear', 'solar:train-bold', 'solar:train-linear',
    'solar:car-bold', 'solar:car-linear', 'solar:scooter-bold', 'solar:scooter-linear',
    'solar:map-point-bold', 'solar:map-point-linear', 'solar:map-bold', 'solar:map-linear',
    'solar:compass-big-bold', 'solar:compass-big-linear', 'solar:compass-bold', 'solar:compass-linear',
    'solar:global-bold', 'solar:global-linear', 'solar:earth-bold', 'solar:earth-linear',
    'solar:home-1-bold', 'solar:home-1-linear', 'solar:home-2-bold', 'solar:home-2-linear',
    'solar:buildings-bold', 'solar:buildings-linear', 'solar:buildings-2-bold', 'solar:buildings-2-linear',
    'solar:shop-bold', 'solar:shop-linear', 'solar:shop-2-bold', 'solar:shop-2-linear',
    'solar:tea-cup-bold', 'solar:tea-cup-linear', 'solar:cup-hot-bold', 'solar:cup-hot-linear',
    'solar:cake-bold', 'solar:cake-linear', 'solar:donut-bold', 'solar:donut-linear',
    'solar:tree-bold', 'solar:tree-linear', 'solar:leaf-bold', 'solar:leaf-linear',
    'solar:sun-bold', 'solar:sun-linear', 'solar:moon-bold', 'solar:moon-linear', 'solar:stars-bold', 'solar:stars-linear',
    'solar:cloud-bold', 'solar:cloud-linear', 'solar:clouds-bold', 'solar:clouds-linear',
    'solar:cloudly-bold', 'solar:cloudly-linear', 'solar:cloud-rain-bold', 'solar:cloud-rain-linear',
    'solar:snowflake-bold', 'solar:snowflake-linear', 'solar:wind-bold', 'solar:wind-linear',
    'solar:temperature-bold', 'solar:temperature-linear',
    'solar:calendar-bold', 'solar:calendar-linear', 'solar:calendar-mark-bold', 'solar:calendar-mark-linear',
    'solar:clock-circle-bold', 'solar:clock-circle-linear', 'solar:alarm-bold', 'solar:alarm-linear',
    'solar:phone-calling-bold', 'solar:phone-calling-linear', 'solar:phone-bold', 'solar:phone-linear',
    'solar:letter-bold', 'solar:letter-linear', 'solar:letter-opened-bold', 'solar:letter-opened-linear',
    'solar:chat-round-bold', 'solar:chat-round-linear', 'solar:chat-line-bold', 'solar:chat-line-linear',
    'solar:wifi-router-bold', 'solar:wifi-router-linear',
    'solar:suitcase-bold', 'solar:suitcase-linear', 'solar:camera-bold', 'solar:camera-linear',
    'solar:gallery-bold', 'solar:gallery-linear', 'solar:gallery-wide-bold', 'solar:gallery-wide-linear',
    'solar:bag-bold', 'solar:bag-linear', 'solar:bag-3-bold', 'solar:bag-3-linear',
    'solar:cart-large-bold', 'solar:cart-large-linear', 'solar:cart-3-bold', 'solar:cart-3-linear',
    'solar:gift-bold', 'solar:gift-linear', 'solar:tag-bold', 'solar:tag-linear',
    'solar:card-bold', 'solar:card-linear', 'solar:wallet-bold', 'solar:wallet-linear',
    'solar:star-bold', 'solar:star-linear', 'solar:stars-bold', 'solar:stars-linear',
    'solar:heart-bold', 'solar:heart-linear', 'solar:hearts-bold', 'solar:hearts-linear',
    'solar:like-bold', 'solar:like-linear', 'solar:dislike-bold', 'solar:dislike-linear',
    'solar:check-circle-bold', 'solar:check-circle-linear', 'solar:close-circle-bold', 'solar:close-circle-linear',
    'solar:smile-circle-bold', 'solar:smile-circle-linear', 'solar:sad-circle-bold', 'solar:sad-circle-linear',
    'solar:info-circle-bold', 'solar:info-circle-linear', 'solar:danger-bold', 'solar:danger-linear',
    'solar:question-circle-bold', 'solar:question-circle-linear', 'solar:lamp-bold', 'solar:lamp-linear',
    'solar:bell-bold', 'solar:bell-linear', 'solar:bookmark-bold', 'solar:bookmark-linear',
    'solar:user-bold', 'solar:user-linear', 'solar:user-circle-bold', 'solar:user-circle-linear',
    'solar:users-group-rounded-bold', 'solar:users-group-rounded-linear',
    'solar:alt-arrow-up-bold', 'solar:alt-arrow-down-bold', 'solar:alt-arrow-left-bold', 'solar:alt-arrow-right-bold',
    'solar:add-circle-bold', 'solar:add-circle-linear', 'solar:minus-circle-bold', 'solar:minus-circle-linear',
  ],

  fluent: [
    'fluent:airplane-20-regular', 'fluent:airplane-20-filled', 'fluent:airplane-take-off-20-regular', 'fluent:airplane-take-off-20-filled',
    'fluent:vehicle-bus-20-regular', 'fluent:vehicle-bus-20-filled', 'fluent:vehicle-subway-20-regular', 'fluent:vehicle-subway-20-filled',
    'fluent:vehicle-car-20-regular', 'fluent:vehicle-car-20-filled', 'fluent:vehicle-truck-20-regular', 'fluent:vehicle-truck-20-filled',
    'fluent:vehicle-ship-20-regular', 'fluent:vehicle-ship-20-filled', 'fluent:vehicle-bicycle-20-regular', 'fluent:vehicle-bicycle-20-filled',
    'fluent:rocket-20-regular', 'fluent:rocket-20-filled',
    'fluent:location-20-regular', 'fluent:location-20-filled', 'fluent:map-20-regular', 'fluent:map-20-filled',
    'fluent:compass-northwest-20-regular', 'fluent:compass-northwest-20-filled', 'fluent:globe-20-regular', 'fluent:globe-20-filled',
    'fluent:flag-20-regular', 'fluent:flag-20-filled',
    'fluent:home-20-regular', 'fluent:home-20-filled', 'fluent:building-20-regular', 'fluent:building-20-filled',
    'fluent:building-multiple-20-regular', 'fluent:building-multiple-20-filled', 'fluent:store-microsoft-20-regular', 'fluent:store-microsoft-20-filled',
    'fluent:drink-coffee-20-regular', 'fluent:drink-coffee-20-filled', 'fluent:food-20-regular', 'fluent:food-20-filled',
    'fluent:food-cake-20-regular', 'fluent:food-cake-20-filled', 'fluent:food-pizza-20-regular', 'fluent:food-pizza-20-filled',
    'fluent:weather-sunny-20-regular', 'fluent:weather-sunny-20-filled', 'fluent:weather-moon-20-regular', 'fluent:weather-moon-20-filled',
    'fluent:weather-cloudy-20-regular', 'fluent:weather-cloudy-20-filled', 'fluent:weather-rain-20-regular', 'fluent:weather-rain-20-filled',
    'fluent:weather-snow-20-regular', 'fluent:weather-snow-20-filled', 'fluent:temperature-20-regular', 'fluent:temperature-20-filled',
    'fluent:calendar-20-regular', 'fluent:calendar-20-filled', 'fluent:calendar-checkmark-20-regular', 'fluent:calendar-checkmark-20-filled',
    'fluent:clock-20-regular', 'fluent:clock-20-filled', 'fluent:clock-alarm-20-regular', 'fluent:clock-alarm-20-filled',
    'fluent:call-20-regular', 'fluent:call-20-filled', 'fluent:phone-20-regular', 'fluent:phone-20-filled',
    'fluent:mail-20-regular', 'fluent:mail-20-filled', 'fluent:mail-read-20-regular', 'fluent:mail-read-20-filled',
    'fluent:chat-20-regular', 'fluent:chat-20-filled', 'fluent:send-20-regular', 'fluent:send-20-filled',
    'fluent:wifi-1-20-regular', 'fluent:wifi-1-20-filled',
    'fluent:briefcase-20-regular', 'fluent:briefcase-20-filled', 'fluent:camera-20-regular', 'fluent:camera-20-filled',
    'fluent:image-20-regular', 'fluent:image-20-filled', 'fluent:image-multiple-20-regular', 'fluent:image-multiple-20-filled',
    'fluent:shopping-bag-20-regular', 'fluent:shopping-bag-20-filled', 'fluent:cart-20-regular', 'fluent:cart-20-filled',
    'fluent:gift-20-regular', 'fluent:gift-20-filled', 'fluent:tag-20-regular', 'fluent:tag-20-filled',
    'fluent:money-20-regular', 'fluent:money-20-filled', 'fluent:wallet-credit-card-20-regular', 'fluent:wallet-credit-card-20-filled',
    'fluent:star-20-regular', 'fluent:star-20-filled', 'fluent:heart-20-regular', 'fluent:heart-20-filled',
    'fluent:thumb-like-20-regular', 'fluent:thumb-like-20-filled', 'fluent:thumb-dislike-20-regular', 'fluent:thumb-dislike-20-filled',
    'fluent:checkmark-circle-20-regular', 'fluent:checkmark-circle-20-filled', 'fluent:dismiss-circle-20-regular', 'fluent:dismiss-circle-20-filled',
    'fluent:emoji-20-regular', 'fluent:emoji-20-filled', 'fluent:emoji-sad-20-regular', 'fluent:emoji-sad-20-filled',
    'fluent:info-20-regular', 'fluent:info-20-filled', 'fluent:warning-20-regular', 'fluent:warning-20-filled',
    'fluent:question-circle-20-regular', 'fluent:question-circle-20-filled', 'fluent:lightbulb-20-regular', 'fluent:lightbulb-20-filled',
    'fluent:alert-20-regular', 'fluent:alert-20-filled', 'fluent:bookmark-20-regular', 'fluent:bookmark-20-filled',
    'fluent:person-20-regular', 'fluent:person-20-filled', 'fluent:people-20-regular', 'fluent:people-20-filled',
    'fluent:arrow-up-20-regular', 'fluent:arrow-down-20-regular', 'fluent:arrow-left-20-regular', 'fluent:arrow-right-20-regular',
    'fluent:chevron-up-20-regular', 'fluent:chevron-down-20-regular', 'fluent:chevron-left-20-regular', 'fluent:chevron-right-20-regular',
    'fluent:add-20-regular', 'fluent:add-20-filled', 'fluent:subtract-20-regular', 'fluent:subtract-20-filled',
  ],

  'ant-design': [
    'ant-design:car-outlined', 'ant-design:car-filled', 'ant-design:rocket-outlined', 'ant-design:rocket-filled',
    'ant-design:environment-outlined', 'ant-design:environment-filled', 'ant-design:compass-outlined', 'ant-design:compass-filled',
    'ant-design:global-outlined', 'ant-design:flag-outlined', 'ant-design:flag-filled',
    'ant-design:home-outlined', 'ant-design:home-filled', 'ant-design:bank-outlined', 'ant-design:bank-filled',
    'ant-design:shop-outlined', 'ant-design:shop-filled', 'ant-design:appstore-outlined', 'ant-design:appstore-filled',
    'ant-design:coffee-outlined', 'ant-design:gift-outlined', 'ant-design:gift-filled',
    'ant-design:calendar-outlined', 'ant-design:calendar-filled', 'ant-design:clock-circle-outlined', 'ant-design:clock-circle-filled',
    'ant-design:phone-outlined', 'ant-design:phone-filled', 'ant-design:mail-outlined', 'ant-design:mail-filled',
    'ant-design:message-outlined', 'ant-design:message-filled', 'ant-design:wechat-outlined', 'ant-design:wechat-filled',
    'ant-design:wifi-outlined', 'ant-design:signal-filled',
    'ant-design:idcard-outlined', 'ant-design:idcard-filled', 'ant-design:camera-outlined', 'ant-design:camera-filled',
    'ant-design:picture-outlined', 'ant-design:picture-filled',
    'ant-design:shopping-cart-outlined', 'ant-design:shopping-outlined', 'ant-design:shopping-filled',
    'ant-design:tag-outlined', 'ant-design:tag-filled', 'ant-design:tags-outlined', 'ant-design:tags-filled',
    'ant-design:dollar-outlined', 'ant-design:dollar-circle-outlined', 'ant-design:dollar-circle-filled',
    'ant-design:credit-card-outlined', 'ant-design:credit-card-filled', 'ant-design:wallet-outlined', 'ant-design:wallet-filled',
    'ant-design:star-outlined', 'ant-design:star-filled', 'ant-design:heart-outlined', 'ant-design:heart-filled',
    'ant-design:like-outlined', 'ant-design:like-filled', 'ant-design:dislike-outlined', 'ant-design:dislike-filled',
    'ant-design:check-outlined', 'ant-design:check-circle-outlined', 'ant-design:check-circle-filled',
    'ant-design:close-outlined', 'ant-design:close-circle-outlined', 'ant-design:close-circle-filled',
    'ant-design:smile-outlined', 'ant-design:smile-filled', 'ant-design:frown-outlined', 'ant-design:frown-filled', 'ant-design:meh-outlined', 'ant-design:meh-filled',
    'ant-design:info-circle-outlined', 'ant-design:info-circle-filled', 'ant-design:exclamation-circle-outlined', 'ant-design:exclamation-circle-filled',
    'ant-design:question-circle-outlined', 'ant-design:question-circle-filled', 'ant-design:bulb-outlined', 'ant-design:bulb-filled',
    'ant-design:bell-outlined', 'ant-design:bell-filled', 'ant-design:book-outlined', 'ant-design:book-filled',
    'ant-design:user-outlined', 'ant-design:user-add-outlined', 'ant-design:team-outlined', 'ant-design:usergroup-add-outlined',
    'ant-design:up-outlined', 'ant-design:down-outlined', 'ant-design:left-outlined', 'ant-design:right-outlined',
    'ant-design:up-circle-outlined', 'ant-design:down-circle-outlined', 'ant-design:left-circle-outlined', 'ant-design:right-circle-outlined',
    'ant-design:plus-outlined', 'ant-design:plus-circle-outlined', 'ant-design:plus-circle-filled',
    'ant-design:minus-outlined', 'ant-design:minus-circle-outlined', 'ant-design:minus-circle-filled',
  ],

  eva: [
    'eva:car-outline', 'eva:car-fill',
    'eva:pin-outline', 'eva:pin-fill', 'eva:navigation-outline', 'eva:navigation-fill', 'eva:navigation-2-outline', 'eva:navigation-2-fill',
    'eva:compass-outline', 'eva:compass-fill', 'eva:globe-outline', 'eva:globe-fill', 'eva:globe-2-outline', 'eva:globe-2-fill',
    'eva:home-outline', 'eva:home-fill',
    'eva:sun-outline', 'eva:sun-fill', 'eva:moon-outline', 'eva:moon-fill',
    'eva:cloud-download-outline', 'eva:cloud-download-fill', 'eva:cloud-upload-outline', 'eva:cloud-upload-fill',
    'eva:umbrella-outline', 'eva:umbrella-fill', 'eva:thermometer-outline', 'eva:thermometer-fill', 'eva:thermometer-minus-outline', 'eva:thermometer-plus-outline',
    'eva:calendar-outline', 'eva:calendar-fill', 'eva:clock-outline', 'eva:clock-fill',
    'eva:phone-outline', 'eva:phone-fill', 'eva:phone-call-outline', 'eva:phone-call-fill',
    'eva:email-outline', 'eva:email-fill', 'eva:message-circle-outline', 'eva:message-circle-fill', 'eva:message-square-outline', 'eva:message-square-fill',
    'eva:wifi-outline', 'eva:wifi-fill', 'eva:wifi-off-outline', 'eva:wifi-off-fill',
    'eva:briefcase-outline', 'eva:briefcase-fill', 'eva:camera-outline', 'eva:camera-fill', 'eva:image-outline', 'eva:image-fill',
    'eva:shopping-bag-outline', 'eva:shopping-bag-fill', 'eva:shopping-cart-outline', 'eva:shopping-cart-fill',
    'eva:gift-outline', 'eva:gift-fill', 'eva:pricetags-outline', 'eva:pricetags-fill',
    'eva:credit-card-outline', 'eva:credit-card-fill',
    'eva:star-outline', 'eva:star-fill', 'eva:heart-outline', 'eva:heart-fill',
    'eva:checkmark-outline', 'eva:checkmark-circle-outline', 'eva:checkmark-circle-fill', 'eva:checkmark-circle-2-outline', 'eva:checkmark-circle-2-fill',
    'eva:close-outline', 'eva:close-circle-outline', 'eva:close-circle-fill',
    'eva:smiling-face-outline', 'eva:smiling-face-fill',
    'eva:info-outline', 'eva:info-fill', 'eva:alert-circle-outline', 'eva:alert-circle-fill', 'eva:alert-triangle-outline', 'eva:alert-triangle-fill',
    'eva:question-mark-circle-outline', 'eva:question-mark-circle-fill', 'eva:bulb-outline', 'eva:bulb-fill',
    'eva:bell-outline', 'eva:bell-fill', 'eva:bell-off-outline', 'eva:bell-off-fill',
    'eva:bookmark-outline', 'eva:bookmark-fill',
    'eva:person-outline', 'eva:person-fill', 'eva:person-add-outline', 'eva:person-add-fill', 'eva:people-outline', 'eva:people-fill',
    'eva:arrow-up-outline', 'eva:arrow-up-fill', 'eva:arrow-down-outline', 'eva:arrow-down-fill',
    'eva:arrow-left-outline', 'eva:arrow-left-fill', 'eva:arrow-right-outline', 'eva:arrow-right-fill',
    'eva:arrow-circle-up-outline', 'eva:arrow-circle-up-fill', 'eva:arrow-circle-down-outline', 'eva:arrow-circle-down-fill',
    'eva:chevron-up-outline', 'eva:chevron-up-fill', 'eva:chevron-down-outline', 'eva:chevron-down-fill',
    'eva:chevron-left-outline', 'eva:chevron-left-fill', 'eva:chevron-right-outline', 'eva:chevron-right-fill',
    'eva:plus-outline', 'eva:plus-fill', 'eva:plus-circle-outline', 'eva:plus-circle-fill',
    'eva:minus-outline', 'eva:minus-fill', 'eva:minus-circle-outline', 'eva:minus-circle-fill',
  ],

  feather: [
    'feather:map-pin', 'feather:map', 'feather:compass', 'feather:globe', 'feather:navigation', 'feather:navigation-2',
    'feather:flag', 'feather:home', 'feather:briefcase',
    'feather:sun', 'feather:sunrise', 'feather:sunset', 'feather:moon', 'feather:star',
    'feather:cloud', 'feather:cloud-drizzle', 'feather:cloud-rain', 'feather:cloud-snow', 'feather:cloud-lightning', 'feather:cloud-off',
    'feather:umbrella', 'feather:wind', 'feather:thermometer',
    'feather:calendar', 'feather:clock', 'feather:watch',
    'feather:phone', 'feather:phone-call', 'feather:phone-incoming', 'feather:phone-outgoing', 'feather:phone-missed', 'feather:phone-off',
    'feather:mail', 'feather:inbox', 'feather:send', 'feather:message-circle', 'feather:message-square',
    'feather:wifi', 'feather:wifi-off',
    'feather:camera', 'feather:camera-off', 'feather:image', 'feather:video', 'feather:video-off',
    'feather:shopping-bag', 'feather:shopping-cart', 'feather:gift', 'feather:tag', 'feather:credit-card', 'feather:dollar-sign',
    'feather:star', 'feather:heart', 'feather:thumbs-up', 'feather:thumbs-down',
    'feather:check', 'feather:check-circle', 'feather:check-square', 'feather:x', 'feather:x-circle', 'feather:x-square',
    'feather:smile', 'feather:frown', 'feather:meh',
    'feather:info', 'feather:alert-circle', 'feather:alert-triangle', 'feather:help-circle',
    'feather:bell', 'feather:bell-off', 'feather:bookmark',
    'feather:user', 'feather:user-check', 'feather:user-minus', 'feather:user-plus', 'feather:user-x', 'feather:users',
    'feather:arrow-up', 'feather:arrow-down', 'feather:arrow-left', 'feather:arrow-right',
    'feather:arrow-up-circle', 'feather:arrow-down-circle', 'feather:arrow-left-circle', 'feather:arrow-right-circle',
    'feather:chevron-up', 'feather:chevron-down', 'feather:chevron-left', 'feather:chevron-right',
    'feather:chevrons-up', 'feather:chevrons-down', 'feather:chevrons-left', 'feather:chevrons-right',
    'feather:plus', 'feather:plus-circle', 'feather:plus-square', 'feather:minus', 'feather:minus-circle', 'feather:minus-square',
    'feather:circle', 'feather:square', 'feather:triangle', 'feather:hexagon', 'feather:octagon',
  ],

  octicon: [
    'octicon:rocket-16', 'octicon:rocket-24',
    'octicon:location-16', 'octicon:location-24', 'octicon:globe-16', 'octicon:globe-24',
    'octicon:home-16', 'octicon:home-24', 'octicon:home-fill-24',
    'octicon:sun-16', 'octicon:sun-24', 'octicon:moon-16', 'octicon:moon-24',
    'octicon:cloud-16', 'octicon:cloud-24', 'octicon:cloud-offline-16', 'octicon:cloud-offline-24',
    'octicon:calendar-16', 'octicon:calendar-24', 'octicon:clock-16', 'octicon:clock-24',
    'octicon:mail-16', 'octicon:mail-24', 'octicon:mention-16', 'octicon:mention-24',
    'octicon:comment-16', 'octicon:comment-24', 'octicon:comment-discussion-16', 'octicon:comment-discussion-24',
    'octicon:broadcast-16', 'octicon:broadcast-24',
    'octicon:briefcase-16', 'octicon:briefcase-24', 'octicon:image-16', 'octicon:image-24',
    'octicon:gift-16', 'octicon:gift-24', 'octicon:tag-16', 'octicon:tag-24',
    'octicon:credit-card-16', 'octicon:credit-card-24',
    'octicon:star-16', 'octicon:star-24', 'octicon:star-fill-16', 'octicon:star-fill-24',
    'octicon:heart-16', 'octicon:heart-24', 'octicon:heart-fill-16', 'octicon:heart-fill-24',
    'octicon:thumbsup-16', 'octicon:thumbsup-24', 'octicon:thumbsdown-16', 'octicon:thumbsdown-24',
    'octicon:check-16', 'octicon:check-24', 'octicon:check-circle-16', 'octicon:check-circle-24', 'octicon:check-circle-fill-16', 'octicon:check-circle-fill-24',
    'octicon:x-16', 'octicon:x-24', 'octicon:x-circle-16', 'octicon:x-circle-24', 'octicon:x-circle-fill-16', 'octicon:x-circle-fill-24',
    'octicon:smiley-16', 'octicon:smiley-24',
    'octicon:info-16', 'octicon:info-24', 'octicon:alert-16', 'octicon:alert-24', 'octicon:alert-fill-24',
    'octicon:question-16', 'octicon:question-24', 'octicon:light-bulb-16', 'octicon:light-bulb-24',
    'octicon:bell-16', 'octicon:bell-24', 'octicon:bell-fill-24', 'octicon:bell-slash-16', 'octicon:bell-slash-24',
    'octicon:bookmark-16', 'octicon:bookmark-24', 'octicon:bookmark-fill-24', 'octicon:bookmark-slash-16', 'octicon:bookmark-slash-24',
    'octicon:person-16', 'octicon:person-24', 'octicon:person-fill-16', 'octicon:person-fill-24',
    'octicon:people-16', 'octicon:people-24',
    'octicon:arrow-up-16', 'octicon:arrow-up-24', 'octicon:arrow-down-16', 'octicon:arrow-down-24',
    'octicon:arrow-left-16', 'octicon:arrow-left-24', 'octicon:arrow-right-16', 'octicon:arrow-right-24',
    'octicon:chevron-up-16', 'octicon:chevron-up-24', 'octicon:chevron-down-16', 'octicon:chevron-down-24',
    'octicon:chevron-left-16', 'octicon:chevron-left-24', 'octicon:chevron-right-16', 'octicon:chevron-right-24',
    'octicon:plus-16', 'octicon:plus-24', 'octicon:plus-circle-16', 'octicon:plus-circle-24',
    'octicon:dash-16', 'octicon:dash-24',
    'octicon:circle-16', 'octicon:circle-24', 'octicon:square-16', 'octicon:square-24', 'octicon:square-fill-16', 'octicon:square-fill-24',
    'octicon:triangle-up-16', 'octicon:triangle-up-24', 'octicon:triangle-down-16', 'octicon:triangle-down-24',
    'octicon:diamond-16', 'octicon:diamond-24',
  ],

  ion: [
    'ion:airplane', 'ion:airplane-outline', 'ion:airplane-sharp',
    'ion:bus', 'ion:bus-outline', 'ion:bus-sharp', 'ion:train', 'ion:train-outline', 'ion:train-sharp',
    'ion:car', 'ion:car-outline', 'ion:car-sharp', 'ion:car-sport', 'ion:car-sport-outline', 'ion:car-sport-sharp',
    'ion:boat', 'ion:boat-outline', 'ion:boat-sharp', 'ion:bicycle', 'ion:bicycle-outline', 'ion:bicycle-sharp',
    'ion:walk', 'ion:walk-outline', 'ion:walk-sharp', 'ion:rocket', 'ion:rocket-outline', 'ion:rocket-sharp',
    'ion:location', 'ion:location-outline', 'ion:location-sharp', 'ion:map', 'ion:map-outline', 'ion:map-sharp',
    'ion:compass', 'ion:compass-outline', 'ion:compass-sharp', 'ion:globe', 'ion:globe-outline', 'ion:globe-sharp',
    'ion:earth', 'ion:earth-outline', 'ion:earth-sharp', 'ion:flag', 'ion:flag-outline', 'ion:flag-sharp',
    'ion:home', 'ion:home-outline', 'ion:home-sharp', 'ion:business', 'ion:business-outline', 'ion:business-sharp',
    'ion:storefront', 'ion:storefront-outline', 'ion:storefront-sharp',
    'ion:cafe', 'ion:cafe-outline', 'ion:cafe-sharp', 'ion:restaurant', 'ion:restaurant-outline', 'ion:restaurant-sharp',
    'ion:pizza', 'ion:pizza-outline', 'ion:pizza-sharp', 'ion:beer', 'ion:beer-outline', 'ion:beer-sharp',
    'ion:wine', 'ion:wine-outline', 'ion:wine-sharp', 'ion:ice-cream', 'ion:ice-cream-outline', 'ion:ice-cream-sharp',
    'ion:leaf', 'ion:leaf-outline', 'ion:leaf-sharp', 'ion:flower', 'ion:flower-outline', 'ion:flower-sharp',
    'ion:rose', 'ion:rose-outline', 'ion:rose-sharp', 'ion:fish', 'ion:fish-outline', 'ion:fish-sharp',
    'ion:paw', 'ion:paw-outline', 'ion:paw-sharp',
    'ion:sunny', 'ion:sunny-outline', 'ion:sunny-sharp', 'ion:moon', 'ion:moon-outline', 'ion:moon-sharp',
    'ion:star', 'ion:star-outline', 'ion:star-sharp', 'ion:star-half', 'ion:star-half-outline', 'ion:star-half-sharp',
    'ion:cloud', 'ion:cloud-outline', 'ion:cloud-sharp', 'ion:cloudy', 'ion:cloudy-outline', 'ion:cloudy-sharp',
    'ion:cloudy-night', 'ion:cloudy-night-outline', 'ion:cloudy-night-sharp',
    'ion:rainy', 'ion:rainy-outline', 'ion:rainy-sharp', 'ion:snow', 'ion:snow-outline', 'ion:snow-sharp',
    'ion:thunderstorm', 'ion:thunderstorm-outline', 'ion:thunderstorm-sharp',
    'ion:umbrella', 'ion:umbrella-outline', 'ion:umbrella-sharp', 'ion:thermometer', 'ion:thermometer-outline', 'ion:thermometer-sharp',
    'ion:calendar', 'ion:calendar-outline', 'ion:calendar-sharp', 'ion:time', 'ion:time-outline', 'ion:time-sharp',
    'ion:alarm', 'ion:alarm-outline', 'ion:alarm-sharp', 'ion:hourglass', 'ion:hourglass-outline',
    'ion:call', 'ion:call-outline', 'ion:call-sharp', 'ion:phone-portrait', 'ion:phone-portrait-outline', 'ion:phone-portrait-sharp',
    'ion:mail', 'ion:mail-outline', 'ion:mail-sharp', 'ion:mail-open', 'ion:mail-open-outline', 'ion:mail-open-sharp',
    'ion:chatbubbles', 'ion:chatbubbles-outline', 'ion:chatbubbles-sharp', 'ion:send', 'ion:send-outline', 'ion:send-sharp',
    'ion:wifi', 'ion:wifi-outline', 'ion:wifi-sharp',
    'ion:briefcase', 'ion:briefcase-outline', 'ion:briefcase-sharp', 'ion:camera', 'ion:camera-outline', 'ion:camera-sharp',
    'ion:image', 'ion:image-outline', 'ion:image-sharp', 'ion:images', 'ion:images-outline', 'ion:images-sharp',
    'ion:bag', 'ion:bag-outline', 'ion:bag-sharp', 'ion:cart', 'ion:cart-outline', 'ion:cart-sharp',
    'ion:gift', 'ion:gift-outline', 'ion:gift-sharp', 'ion:pricetag', 'ion:pricetag-outline', 'ion:pricetag-sharp',
    'ion:card', 'ion:card-outline', 'ion:card-sharp', 'ion:wallet', 'ion:wallet-outline', 'ion:wallet-sharp',
    'ion:cash', 'ion:cash-outline', 'ion:cash-sharp',
    'ion:heart', 'ion:heart-outline', 'ion:heart-sharp', 'ion:heart-half', 'ion:heart-half-outline', 'ion:heart-half-sharp',
    'ion:thumbs-up', 'ion:thumbs-up-outline', 'ion:thumbs-up-sharp', 'ion:thumbs-down', 'ion:thumbs-down-outline', 'ion:thumbs-down-sharp',
    'ion:checkmark', 'ion:checkmark-circle', 'ion:checkmark-circle-outline', 'ion:checkmark-circle-sharp',
    'ion:close', 'ion:close-circle', 'ion:close-circle-outline', 'ion:close-circle-sharp',
    'ion:happy', 'ion:happy-outline', 'ion:happy-sharp', 'ion:sad', 'ion:sad-outline', 'ion:sad-sharp',
    'ion:information-circle', 'ion:information-circle-outline', 'ion:information-circle-sharp',
    'ion:warning', 'ion:warning-outline', 'ion:warning-sharp',
    'ion:help-circle', 'ion:help-circle-outline', 'ion:help-circle-sharp', 'ion:bulb', 'ion:bulb-outline', 'ion:bulb-sharp',
    'ion:notifications', 'ion:notifications-outline', 'ion:notifications-sharp', 'ion:bookmark', 'ion:bookmark-outline', 'ion:bookmark-sharp',
    'ion:person', 'ion:person-outline', 'ion:person-sharp', 'ion:person-circle', 'ion:person-circle-outline', 'ion:person-circle-sharp',
    'ion:people', 'ion:people-outline', 'ion:people-sharp', 'ion:people-circle', 'ion:people-circle-outline', 'ion:people-circle-sharp',
    'ion:arrow-up', 'ion:arrow-up-outline', 'ion:arrow-up-sharp', 'ion:arrow-down', 'ion:arrow-down-outline', 'ion:arrow-down-sharp',
    'ion:arrow-back', 'ion:arrow-back-outline', 'ion:arrow-back-sharp', 'ion:arrow-forward', 'ion:arrow-forward-outline', 'ion:arrow-forward-sharp',
    'ion:chevron-up', 'ion:chevron-up-outline', 'ion:chevron-up-sharp', 'ion:chevron-down', 'ion:chevron-down-outline', 'ion:chevron-down-sharp',
    'ion:chevron-back', 'ion:chevron-back-outline', 'ion:chevron-back-sharp', 'ion:chevron-forward', 'ion:chevron-forward-outline', 'ion:chevron-forward-sharp',
    'ion:add', 'ion:add-outline', 'ion:add-sharp', 'ion:add-circle', 'ion:add-circle-outline', 'ion:add-circle-sharp',
    'ion:remove', 'ion:remove-outline', 'ion:remove-sharp', 'ion:remove-circle', 'ion:remove-circle-outline', 'ion:remove-circle-sharp',
    'ion:ellipse', 'ion:ellipse-outline', 'ion:ellipse-sharp', 'ion:square', 'ion:square-outline', 'ion:square-sharp',
    'ion:triangle', 'ion:triangle-outline', 'ion:triangle-sharp',
  ],
}

// 中文到英文關鍵字對照（擴充版）
const ZH_TO_EN: Record<string, string[]> = {
  // 交通
  '飛機': ['airplane', 'plane', 'flight', 'aircraft'],
  '機場': ['airport', 'airplane', 'terminal'],
  '巴士': ['bus', 'coach'],
  '公車': ['bus'],
  '火車': ['train', 'railway'],
  '高鐵': ['train', 'rail', 'bullet'],
  '汽車': ['car', 'automobile', 'vehicle'],
  '計程車': ['taxi', 'cab'],
  '船': ['ship', 'boat', 'ferry'],
  '郵輪': ['cruise', 'ship'],
  '走路': ['walk', 'pedestrian', 'walking'],
  '步行': ['walk', 'pedestrian'],
  '腳踏車': ['bicycle', 'bike', 'cycling'],
  '機車': ['motorcycle', 'scooter'],

  // 地點
  '地點': ['location', 'place', 'pin', 'marker'],
  '地圖': ['map', 'navigation'],
  '地標': ['landmark', 'monument'],
  '國旗': ['flag', 'country'],
  '世界': ['world', 'globe', 'earth'],
  '指南針': ['compass', 'navigation'],

  // 住宿
  '飯店': ['hotel', 'accommodation', 'lodging', 'building'],
  '旅館': ['hotel', 'inn', 'motel'],
  '民宿': ['home', 'house', 'homestay'],
  '房間': ['room', 'bed', 'bedroom'],
  '床': ['bed', 'sleep'],
  '住宿': ['hotel', 'accommodation', 'stay'],

  // 餐飲
  '餐廳': ['restaurant', 'dining', 'food'],
  '食物': ['food', 'meal', 'eat'],
  '美食': ['food', 'cuisine', 'delicious'],
  '早餐': ['breakfast', 'morning'],
  '午餐': ['lunch', 'noon'],
  '晚餐': ['dinner', 'evening'],
  '咖啡': ['coffee', 'cafe'],
  '飲料': ['drink', 'beverage'],
  '酒': ['wine', 'beer', 'alcohol', 'bar'],

  // 景點
  '景點': ['attraction', 'landmark', 'sightseeing'],
  '博物館': ['museum', 'gallery'],
  '神社': ['shrine', 'temple'],
  '寺廟': ['temple', 'shrine'],
  '教堂': ['church', 'cathedral'],
  '城堡': ['castle', 'palace'],
  '公園': ['park', 'garden'],
  '海灘': ['beach', 'sea', 'ocean'],
  '山': ['mountain', 'hill'],
  '瀑布': ['waterfall', 'falls'],
  '湖': ['lake', 'pond'],

  // 天氣
  '天氣': ['weather', 'climate'],
  '太陽': ['sun', 'sunny'],
  '晴天': ['sunny', 'clear'],
  '雲': ['cloud', 'cloudy'],
  '雨': ['rain', 'rainy', 'umbrella'],
  '雪': ['snow', 'snowy', 'winter'],
  '風': ['wind', 'windy'],
  '溫度': ['temperature', 'thermometer'],

  // 時間
  '日曆': ['calendar', 'date', 'schedule'],
  '時間': ['time', 'clock', 'hour'],
  '時鐘': ['clock', 'time'],
  '鬧鐘': ['alarm', 'clock'],

  // 通訊
  '電話': ['phone', 'call', 'telephone'],
  '手機': ['phone', 'mobile', 'smartphone'],
  '信箱': ['email', 'mail', 'envelope'],
  '訊息': ['message', 'chat', 'sms'],

  // 旅遊用品
  '護照': ['passport', 'id', 'identification'],
  '行李': ['luggage', 'baggage', 'suitcase'],
  '行李箱': ['suitcase', 'luggage'],
  '背包': ['backpack', 'bag', 'rucksack'],
  '相機': ['camera', 'photo'],
  '照片': ['photo', 'picture', 'image'],

  // 購物
  '購物': ['shopping', 'shop', 'store'],
  '商店': ['shop', 'store', 'market'],
  '禮物': ['gift', 'present'],
  '票': ['ticket', 'pass'],
  '錢': ['money', 'cash', 'currency'],
  '信用卡': ['credit', 'card', 'payment'],

  // 評價
  '星星': ['star', 'rating'],
  '愛心': ['heart', 'love', 'favorite'],
  '讚': ['like', 'thumb', 'good'],
  '推薦': ['recommend', 'thumb', 'star'],

  // 資訊
  '資訊': ['info', 'information'],
  '注意': ['warning', 'alert', 'caution'],
  '警告': ['warning', 'alert', 'danger'],
  '幫助': ['help', 'question', 'support'],
  '提示': ['tip', 'hint', 'lightbulb'],

  // 其他
  '人': ['person', 'user', 'people'],
  '家庭': ['family', 'group', 'people'],
  '孩子': ['child', 'kid', 'baby'],
  '廁所': ['toilet', 'restroom', 'wc'],
  '醫院': ['hospital', 'medical', 'health'],
  '藥': ['medicine', 'pharmacy', 'pill'],
  '安全': ['safety', 'security', 'shield'],
  '緊急': ['emergency', 'urgent', 'sos'],
  'wifi': ['wifi', 'internet', 'network'],
  '插座': ['plug', 'socket', 'power'],
  '充電': ['charge', 'battery', 'power'],
}

// 將中文轉換為英文搜尋詞
function translateToEnglish(query: string): string[] {
  const results: string[] = []

  // 直接加入原始查詢（可能是英文）
  results.push(query.toLowerCase())

  // 檢查中文關鍵字
  for (const [zh, enList] of Object.entries(ZH_TO_EN)) {
    if (query.includes(zh) || zh.includes(query)) {
      results.push(...enList)
    }
  }

  return [...new Set(results)]
}

export function IconPicker({ onSelectIcon }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [selectedSet, setSelectedSet] = useState('mdi')
  const [icons, setIcons] = useState<string[]>(ICONS_BY_SET.mdi)
  const [isLoading, setIsLoading] = useState(false)

  // 切換圖示集時更新圖示
  useEffect(() => {
    if (!search.trim()) {
      setIcons(ICONS_BY_SET[selectedSet] || [])
    }
  }, [selectedSet, search])

  // 搜尋圖示
  useEffect(() => {
    if (!search.trim()) {
      setIcons(ICONS_BY_SET[selectedSet] || [])
      return
    }

    const searchIcons = async () => {
      setIsLoading(true)

      try {
        // 將搜尋詞轉換為英文
        const keywords = translateToEnglish(search.trim())
        const allIcons: string[] = []

        // 只搜尋第一個關鍵字（最相關的）
        const keyword = keywords[0]

        // 搜尋所有可商用圖示集
        const prefixes = ICON_SETS.map(s => s.prefix).join(',')

        // 使用 Iconify API 搜尋
        const response = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&limit=60&prefixes=${prefixes}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.icons && Array.isArray(data.icons)) {
            // 根據選中的圖示集過濾，但如果結果太少就顯示全部
            const filtered = data.icons.filter((icon: string) => icon.startsWith(selectedSet + ':'))
            if (filtered.length >= 5) {
              allIcons.push(...filtered)
            } else {
              // 結果太少，顯示所有圖示集的結果
              allIcons.push(...data.icons)
            }
          }
        }

        setIcons(allIcons.length > 0 ? allIcons : [])
      } catch (error) {
        logger.error('搜尋圖示失敗:', error)
        setIcons([])
      } finally {
        setIsLoading(false)
      }
    }

    // 防抖
    const timer = setTimeout(searchIcons, 400)
    return () => clearTimeout(timer)
  }, [search, selectedSet])

  const handleSelect = useCallback((iconName: string) => {
    onSelectIcon(iconName, selectedSet)
  }, [selectedSet, onSelectIcon])

  return (
    <div className="flex flex-col h-full">
      {/* 搜尋框 */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-morandi-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋圖示（支援中文：飯店、餐廳...）"
            className="pl-8 pr-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 圖示集選擇 */}
      <div className="p-2 border-b border-border">
        <Select value={selectedSet} onValueChange={setSelectedSet}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="選擇圖示集" />
          </SelectTrigger>
          <SelectContent>
            {ICON_SETS.map((set) => (
              <SelectItem key={set.prefix} value={set.prefix}>
                <span className="flex items-center gap-2">
                  <span>{set.name}</span>
                  <span className="text-[10px] text-morandi-secondary">({set.license})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 授權提示 */}
      <div className="px-2 py-1 text-[10px] text-morandi-secondary bg-morandi-container/30">
        共 {ICON_SETS.length} 個圖示集 · {ICONS_BY_SET[selectedSet]?.length || 0} 個圖示 · 可商用印刷
      </div>

      {/* 圖示列表 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-morandi-gold" />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1 p-2">
            {icons.map((iconName) => (
              <button
                key={iconName}
                onClick={() => handleSelect(iconName)}
                className="flex flex-col items-center justify-center p-2 rounded hover:bg-morandi-container/50 transition-colors group"
                title={iconName}
              >
                <Icon
                  icon={iconName}
                  className="w-6 h-6 text-morandi-primary group-hover:text-morandi-gold transition-colors"
                />
              </button>
            ))}
          </div>
        )}

        {!isLoading && icons.length === 0 && (
          <div className="p-4 text-center text-sm text-morandi-secondary">
            找不到符合的圖示，試試其他關鍵字
          </div>
        )}
      </div>

      {/* 圖示數量 */}
      <div className="p-2 border-t border-border text-[10px] text-morandi-secondary text-center">
        {search ? `找到 ${icons.length} 個圖示` : '熱門旅遊圖示'}
      </div>
    </div>
  )
}
