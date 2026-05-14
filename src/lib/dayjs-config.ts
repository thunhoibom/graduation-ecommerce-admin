/**
 * Ant Design 6 DatePicker / rc-picker expects dayjs with weekday + localeData.
 * Import this once before any DatePicker renders (e.g. from AntdProvider).
 */
import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import weekday from 'dayjs/plugin/weekday'
import 'dayjs/locale/vi'

dayjs.extend(weekday)
dayjs.extend(localeData)
dayjs.locale('vi')
