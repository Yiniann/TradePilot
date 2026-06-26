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
- status         CustomerStatus
- stage          CustomerStage
- source         CustomerSource?
- country        string?
- website        string?
- industry       string?
- note           string?
- ownerId        uuid?
- deletedAt      datetime?
- createdAt      datetime
- updatedAt      datetime

Contact
- id             uuid
- customerId     uuid
- name           string
- title          string?
- email          string?
- phone          string?
- whatsapp       string?
- wechat         string?
- isPrimary      boolean
- note           string?
- deletedAt      datetime?
- createdAt      datetime
- updatedAt      datetime

CustomerStatus
- ACTIVE
- ARCHIVED

CustomerStage
- NEW
- QUALIFIED
- QUOTED
- NEGOTIATING
- WON
- LOST

CustomerSource
- WEBSITE
- MANUAL
- EMAIL
- EXHIBITION
- REFERRAL
- AD
- OTHER