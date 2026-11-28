---
db_view: true
database:
  id: mwzv22ds_rl9oodp
  name: Task planner
  icon: lucide:lucide-list-todo@indigo
  coverImage: database/records/Task planner/artwork/database-cover.svg
  coverImagePositionY: 50
  description: Plan deadlines and see progress in a chart.
  sourceFolder: database/records/Task planner
  sourceRules: []
  sourceLogic: and
  newRecordFolder: database/records/Task planner
  recordIconField: ""
  computedSyncMode: display-only
  summaryFormulas: {}
  columns:
    - key: file.name
      label: Name
      type: text
    - key: status
      label: Status
      type: status
      statusOptions:
        - value: To do
          color: gray
        - value: In progress
          color: blue
        - value: Done
          color: green
    - key: complete_task
      label: Complete task
      type: button
      buttonConfig:
        label: Complete task
        icon: check
        style: primary
        actions: []
        steps:
          - kind: edit
            target: trigger
            actions:
              - field: status
                fieldType: status
                operation: set
                value: Done
    - key: schedule_tomorrow
      label: Plan for tomorrow
      type: button
      buttonConfig:
        label: Plan for tomorrow
        icon: calendar-clock
        style: default
        actions: []
        steps:
          - kind: edit
            target: trigger
            actions:
              - field: due
                fieldType: date
                operation: set
                dynamic:
                  source: date
                  value: today
                  offsetDays: 1
    - key: priority
      label: Priority
      type: select
      statusOptions:
        - value: High
          color: gray
        - value: Medium
          color: blue
        - value: Low
          color: green
    - key: due
      label: Due date
      type: date
    - key: effort
      label: Effort
      type: number
    - key: task
      label: Tâche
      type: text
    - key: Projet lié
      label: Projet lié
      type: relation
      relationConfig:
        targetDatabaseId: mwzv22ds_rl9oodp
  computedFields: []
  statusPresets:
    - id: general
      name: 通用状态
      options:
        - value: 未开始
          color: gray
        - value: 进行中
          color: blue
        - value: 已完成
          color: green
    - id: task
      name: 任务状态
      options:
        - value: 待处理
          color: gray
        - value: 进行中
          color: blue
        - value: 受阻
          color: orange
        - value: 已完成
          color: green
        - value: 已取消
          color: red
    - id: reading
      name: 阅读状态
      options:
        - value: 待读
          color: gray
        - value: 阅读中
          color: blue
        - value: 已读
          color: green
        - value: 暂停
          color: orange
        - value: 放弃
          color: red
    - id: review
      name: 审核状态
      options:
        - value: 待审核
          color: gray
        - value: 审核中
          color: blue
        - value: 已通过
          color: green
        - value: 已拒绝
          color: red
    - id: starter-task-planner-status
      name: Task planner workflow
      options:
        - value: To do
          color: gray
        - value: In progress
          color: blue
        - value: Done
          color: green
  defaultStatusPresetId: starter-task-planner-status
  views:
    - id: mwzv22dt_ysebus3
      name: Table view
      viewType: table
      sourceFolder: ""
      sourceRules: []
      sourceLogic: and
      showRecordIcon: true
      recordIconFieldOverrideEnabled: true
      recordIconField: task
      newRecordFolder: ""
      displayWidth: default
      sortColumn: ""
      sortDirection: asc
      sortRules: []
      columnOrder:
        - file.name
        - status
        - complete_task
        - schedule_tomorrow
        - priority
        - due
        - effort
        - task
        - Projet lié
      columnWidths: {}
      hiddenColumns: []
      sortColumnOrder: ""
      statusFilter: ""
      groupByField: ""
      groupOrders: {}
      showEmptyGroups: {}
      collapsedGroups: {}
      boardGroupField: ""
      boardSubgroupEnabled: false
      boardSubgroupField: ""
      titleField: ""
      boardCardOrders: {}
      manualOrder:
        ranks:
          database/records/Task planner/Set weekly priorities.md: FV00
          database/records/Task planner/Prepare the next milestone.md: V000
          database/records/Task planner/Review finished work.md: kV00
          database/records/Task planner/Untitled.md: kV00V
          database/records/Task planner/Untitled 1.md: kV00VV
      galleryImageField: ""
      boardImageField: ""
      statusPresets: []
      defaultStatusPresetId: ""
      filterLogic: and
      filters: []
      summaryRules: []
      conditionalFormats: []
      chartType: bar
      chartGroupField: ""
      chartDateBucket: ""
      chartNumberBucket: ""
      chartStackField: ""
      chartSeriesField: ""
      chartAggregation: count
      chartValueField: ""
      chartSecondaryAggregation: count
      chartSecondaryValueField: ""
      chartSortBy: ""
      chartHiddenGroups: {}
      chartOmitZeroValues: false
      chartCumulative: false
      chartHeight: ""
      chartGridLines: ""
      chartAxisNames: ""
      chartTitle: ""
      chartDataLabelMode: ""
      chartDataLabelColor: ""
      chartSmoothLine: false
      chartGradientArea: false
      chartColorPalette: ""
      chartColorByValue: false
      chartShowDonutCenter: false
      chartDonutCenterMode: ""
      chartValueAxisRange: ""
      chartReferenceLines: []
      calendarMonth: ""
      calendarStartDateField: ""
      calendarEndDateField: ""
      calendarTitleField: ""
      calendarColorField: ""
      calendarKeepCellAspectRatio: false
      calendarScale: ""
      calendarDay: ""
      calendarWeekStart: ""
      timelineStartDateField: ""
      timelineEndDateField: ""
      timelineGroupField: ""
      timelineTitleField: ""
      timelineColorField: ""
      timelineScale: ""
      timelineAnchor: ""
      timelineColumnSizeMode: ""
      formTitle: ""
      formCoverImage: ""
      formCoverMode: banner
      formRequiredFields: []
      viewStates:
        table: {}
    - id: mwzv22dt_rmugdz5
      name: Calendar view
      viewType: calendar
      sourceFolder: ""
      sourceRules: []
      sourceLogic: and
      recordIconFieldOverrideEnabled: false
      recordIconField: ""
      newRecordFolder: ""
      displayWidth: default
      sortColumn: ""
      sortDirection: asc
      sortRules: []
      columnOrder:
        - file.name
        - status
        - complete_task
        - schedule_tomorrow
        - priority
        - due
        - effort
      columnWidths: {}
      hiddenColumns: []
      sortColumnOrder: ""
      statusFilter: ""
      groupByField: ""
      groupOrders: {}
      showEmptyGroups: {}
      collapsedGroups: {}
      boardGroupField: ""
      boardSubgroupEnabled: false
      boardSubgroupField: ""
      titleField: ""
      boardCardOrders: {}
      galleryImageField: ""
      boardImageField: ""
      statusPresets: []
      defaultStatusPresetId: ""
      filterLogic: and
      filters: []
      summaryRules: []
      conditionalFormats: []
      chartType: bar
      chartGroupField: ""
      chartDateBucket: ""
      chartNumberBucket: ""
      chartStackField: ""
      chartSeriesField: ""
      chartAggregation: count
      chartValueField: ""
      chartSecondaryAggregation: count
      chartSecondaryValueField: ""
      chartSortBy: ""
      chartHiddenGroups: {}
      chartOmitZeroValues: false
      chartCumulative: false
      chartHeight: ""
      chartGridLines: ""
      chartAxisNames: ""
      chartTitle: ""
      chartDataLabelMode: ""
      chartDataLabelColor: ""
      chartSmoothLine: false
      chartGradientArea: false
      chartColorPalette: ""
      chartColorByValue: false
      chartShowDonutCenter: false
      chartDonutCenterMode: ""
      chartValueAxisRange: ""
      chartReferenceLines: []
      calendarMonth: ""
      calendarStartDateField: due
      calendarEndDateField: ""
      calendarTitleField: ""
      calendarColorField: ""
      calendarKeepCellAspectRatio: false
      calendarScale: ""
      calendarDay: ""
      calendarWeekStart: ""
      timelineStartDateField: ""
      timelineEndDateField: ""
      timelineGroupField: ""
      timelineTitleField: ""
      timelineColorField: ""
      timelineScale: ""
      timelineAnchor: ""
      timelineColumnSizeMode: ""
      formTitle: ""
      formCoverImage: ""
      formCoverMode: banner
      formRequiredFields: []
      viewStates: {}
    - id: mwzv22dt_ly7wf94
      name: Task progress
      viewType: chart
      sourceFolder: ""
      sourceRules: []
      sourceLogic: and
      recordIconFieldOverrideEnabled: false
      recordIconField: ""
      newRecordFolder: ""
      displayWidth: default
      sortColumn: ""
      sortDirection: asc
      sortRules: []
      columnOrder:
        - file.name
        - status
        - complete_task
        - schedule_tomorrow
        - priority
        - due
        - effort
      columnWidths: {}
      hiddenColumns: []
      sortColumnOrder: ""
      statusFilter: ""
      groupByField: ""
      groupOrders: {}
      showEmptyGroups: {}
      collapsedGroups: {}
      boardGroupField: ""
      boardSubgroupEnabled: false
      boardSubgroupField: ""
      titleField: ""
      boardCardOrders: {}
      galleryImageField: ""
      boardImageField: ""
      statusPresets: []
      defaultStatusPresetId: ""
      filterLogic: and
      filters: []
      summaryRules: []
      conditionalFormats: []
      chartType: donut
      chartGroupField: status
      chartDateBucket: ""
      chartNumberBucket: ""
      chartStackField: ""
      chartSeriesField: ""
      chartAggregation: count
      chartValueField: ""
      chartSecondaryAggregation: count
      chartSecondaryValueField: ""
      chartSortBy: ""
      chartHiddenGroups: {}
      chartOmitZeroValues: false
      chartCumulative: false
      chartHeight: ""
      chartGridLines: ""
      chartAxisNames: ""
      chartTitle: ""
      chartDataLabelMode: ""
      chartDataLabelColor: ""
      chartSmoothLine: false
      chartGradientArea: false
      chartColorPalette: ""
      chartColorByValue: false
      chartShowDonutCenter: false
      chartDonutCenterMode: ""
      chartValueAxisRange: ""
      chartReferenceLines: []
      calendarMonth: ""
      calendarStartDateField: ""
      calendarEndDateField: ""
      calendarTitleField: ""
      calendarColorField: ""
      calendarKeepCellAspectRatio: false
      calendarScale: ""
      calendarDay: ""
      calendarWeekStart: ""
      timelineStartDateField: ""
      timelineEndDateField: ""
      timelineGroupField: ""
      timelineTitleField: ""
      timelineColorField: ""
      timelineScale: ""
      timelineAnchor: ""
      timelineColumnSizeMode: ""
      formTitle: ""
      formCoverImage: ""
      formCoverMode: banner
      formRequiredFields: []
      viewStates: {}
    - id: mwzv22dt_73rhqmx
      name: Effort by priority
      viewType: chart
      sourceFolder: ""
      sourceRules: []
      sourceLogic: and
      recordIconFieldOverrideEnabled: false
      recordIconField: ""
      newRecordFolder: ""
      displayWidth: default
      sortColumn: ""
      sortDirection: asc
      sortRules: []
      columnOrder:
        - file.name
        - status
        - complete_task
        - schedule_tomorrow
        - priority
        - due
        - effort
      columnWidths: {}
      hiddenColumns: []
      sortColumnOrder: ""
      statusFilter: ""
      groupByField: ""
      groupOrders: {}
      showEmptyGroups: {}
      collapsedGroups: {}
      boardGroupField: ""
      boardSubgroupEnabled: false
      boardSubgroupField: ""
      titleField: ""
      boardCardOrders: {}
      galleryImageField: ""
      boardImageField: ""
      statusPresets: []
      defaultStatusPresetId: ""
      filterLogic: and
      filters: []
      summaryRules: []
      conditionalFormats: []
      chartType: horizontal-bar
      chartGroupField: priority
      chartDateBucket: ""
      chartNumberBucket: ""
      chartStackField: ""
      chartSeriesField: ""
      chartAggregation: sum
      chartValueField: effort
      chartSecondaryAggregation: count
      chartSecondaryValueField: ""
      chartSortBy: ""
      chartHiddenGroups: {}
      chartOmitZeroValues: false
      chartCumulative: false
      chartHeight: ""
      chartGridLines: ""
      chartAxisNames: ""
      chartTitle: ""
      chartDataLabelMode: ""
      chartDataLabelColor: ""
      chartSmoothLine: false
      chartGradientArea: false
      chartColorPalette: ""
      chartColorByValue: false
      chartShowDonutCenter: false
      chartDonutCenterMode: ""
      chartValueAxisRange: ""
      chartReferenceLines: []
      calendarMonth: ""
      calendarStartDateField: ""
      calendarEndDateField: ""
      calendarTitleField: ""
      calendarColorField: ""
      calendarKeepCellAspectRatio: false
      calendarScale: ""
      calendarDay: ""
      calendarWeekStart: ""
      timelineStartDateField: ""
      timelineEndDateField: ""
      timelineGroupField: ""
      timelineTitleField: ""
      timelineColorField: ""
      timelineScale: ""
      timelineAnchor: ""
      timelineColumnSizeMode: ""
      formTitle: ""
      formCoverImage: ""
      formCoverMode: banner
      formRequiredFields: []
      viewStates: {}
---

