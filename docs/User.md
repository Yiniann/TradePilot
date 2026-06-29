角色:
SUPER_ADMIN  超级管理员
ADMIN        管理员
SALES        销售
VIEWER       只读

权限边界：
SUPER_ADMIN
- 所有权限
- 可创建/禁用/修改任何账号
- 可修改系统设置
- 不允许删除最后一个超级管理员

ADMIN
- 可管理客户、联系人、询盘
- 可创建/禁用 SALES 和 VIEWER
- 可分配客户/询盘负责人
- 不可操作 SUPER_ADMIN
- 不可修改系统级安全设置

SALES
- 可查看分配给自己的客户和询盘
- 可编辑自己负责的客户跟进信息
- 可回复自己负责的询盘
- 可创建客户、联系人、跟进记录
- 不可删除客户
- 不可管理账号

VIEWER
- 可查看客户、询盘、动态
- 不可创建、编辑、回复、删除
- 不可管理账号

登录：账号密码
初始化：首次无用户时创建超级管理员
会话：Cookie Session，默认 7 天，保持登录 30 天
数据库：Prisma + PostgreSQL
系统形态：单组织内部后台
角色：SUPER_ADMIN / ADMIN / SALES / VIEWER

询盘闭环：
1. 访客从产品页提交询盘，系统按邮箱匹配已有联系人；未匹配时自动创建官网来源客户和主联系人。
2. 已有客户优先继承有效负责人；新客户按未分配、默认负责人或轮询规则进入业务队列。并发提交会锁定邮箱和轮询游标，避免重复客户和重复分配。
3. 客户收到确认邮件和 90 天安全会话入口；自动分配的业务收到新询盘通知，未分配询盘通知管理员。
4. 业务回复先记录邮件投递状态。只有邮件发送成功后询盘才变为 REPLIED；失败会保留原因并允许重试，客户不会看到未成功发送的回复。
5. 客户从邮件回到站点继续沟通后，询盘变为 CUSTOMER_REPLIED，并通知负责人；没有有效负责人时通知管理员。
6. 客户、联系人、历史询盘、沟通记录、负责人和阶段沉淀到同一客户卡片。首次成功回复会把 NEW 客户推进到 CONTACTED，不覆盖更靠后的阶段。


数据库

User
- id                 uuid
- name               string
- email              string unique
- passwordHash       string
- role               UserRole
- status             UserStatus
- lastLoginAt        datetime?
- passwordChangedAt  datetime?
- createdAt          datetime
- updatedAt          datetime

Session
- id          uuid
- userId      uuid
- tokenHash   string unique
- expiresAt   datetime
- revokedAt   datetime?
- lastUsedAt  datetime?
- ipAddress   string?
- userAgent   string?
- createdAt   datetime

枚举

UserRole
- SUPER_ADMIN
- ADMIN
- SALES
- VIEWER

UserStatus
- ACTIVE
- DISABLED

Customer
- id             uuid
- name           string
- stage          CustomerStage
- source         CustomerSource
- country        string?
- website        string?
- note           string?
- ownerId        uuid?
- deletedAt      datetime?
- createdAt      datetime
- updatedAt      datetime

Contact
- id             uuid
- customerId     uuid
- name           string
- email          string?
- phone          string?
- isPrimary      boolean
- note           string?
- deletedAt      datetime?
- createdAt      datetime
- updatedAt      datetime

CustomerStage
- NEW
- CONTACTED
- QUOTED
- WON
- LOST

CustomerSource
- WEBSITE
- MANUAL
- EMAIL
- REFERRAL
- OTHER

InquiryStatus
- NEW
- ASSIGNED
- CUSTOMER_REPLIED
- REPLIED
- CLOSED

MessageDeliveryStatus
- NOT_APPLICABLE
- PENDING
- SENT
- FAILED

Inquiry
- id             uuid
- customerId     uuid?
- contactId      uuid?
- productId      uuid?
- subject        string
- status         InquiryStatus
- source         InquirySource
- priority       InquiryPriority
- message        string
- ownerId        uuid?
- receivedAt     datetime
- createdAt      datetime
- updatedAt      datetime

InquiryMessage
- id             uuid
- inquiryId      uuid
- direction      MessageDirection
- body           string
- authorId       uuid?
- deliveryStatus MessageDeliveryStatus
- deliveryError  string?
- deliveredAt    datetime?
- createdAt      datetime
