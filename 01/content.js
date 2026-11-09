// 所有页面文字都在这里,直接改这个文件即可。
// 注意:页面标题(关于我/作品/博客/联系)、徽章图标、手机 App 图标是画在背景图里的,只改这里不会变。
window.SITE = {
  siteTitle: '小岛主页',

  about: {
    avatar: '', // 填图片地址替换相框里的剪影,例如 'img/me.jpg'
    name: '小桃',
    role: '设计师 / 开发者',
    intro: '你好,欢迎来到我的小岛。我喜欢把可爱的想法,做成能点、能玩的东西。',
    // 对应左页 🌿 ❤ ⭐ 三行,第一行固定显示 名字 · 身份
    likes: '咖啡、猫、樱花',
    doing: '个人网站和小游戏',
    // 对应右页 6 枚徽章(从左到右、从上到下),只能改文字
    skills: ['园艺', '阅读', '摄影', '游戏', '咖啡', '猫'],
  },

  // 每页 3 幅,超过 3 个会自动分页
  works: [
    { title: '海边小屋', tag: '风景', cover: 'img/cover-1.jpg', href: '#' },
    { title: '花卉', tag: '插画', cover: 'img/cover-2.jpg', href: '#' },
    { title: '海底', tag: '动物', cover: 'img/cover-3.jpg', href: '#' },
    { title: '樱花日历', tag: '应用', cover: 'img/cover-4.jpg', href: '#' },
    { title: '瀑布', tag: '摄影', cover: 'img/cover-5.jpg', href: '#' },
    { title: '我的小屋', tag: '游戏', cover: 'img/cover-6.jpg', href: '#' },
  ],

  // 最多显示 6 篇
  blog: [
    { title: '给自己搭一座小岛', date: '2026-11-02', excerpt: '为什么我想把个人网站做成一个可以逛的地方,以及做的时候踩过的坑。', href: '#' },
    { title: '卡通渲染入门', date: '2026-10-18', excerpt: '用三段色阶加描边,就能让 3D 模型看起来像手绘。', href: '#' },
    { title: '一杯咖啡的时间', date: '2026-09-30', excerpt: '写给每天早上第一件事就是冲咖啡的自己。', href: '#' },
    { title: '设计里的留白', date: '2026-09-12', excerpt: '少一点说明文字,界面反而更好懂。', href: '#' },
    { title: '春天的樱花', date: '2026-04-03', excerpt: '花期很短,所以要认真看。', href: '#' },
  ],

  // 顺序对应手机上的 5 个图标:邮件、代码、聊天、相机、音乐
  contact: [
    { label: '邮件', value: 'hello@example.com', href: 'mailto:hello@example.com', copy: true },
    { label: '代码', value: 'github.com/your-name', href: 'https://github.com/' },
    { label: '聊天', value: 'your_wechat_id', copy: true },
    { label: '相机', value: '@your_name', href: 'https://www.instagram.com/' },
    { label: '音乐', value: '我的歌单', href: 'https://music.163.com/' },
  ],
};
