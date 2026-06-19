export default defineAppConfig({
  pages: [
    'pages/find/index',
    'pages/queue/index',
    'pages/mine/index',
    'pages/detail/index',
    'pages/join/index',
    'pages/confirm/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B35',
    navigationBarTitleText: '欢乐上车',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#8E8EA0',
    selectedColor: '#FF6B35',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/find/index',
        text: '找局'
      },
      {
        pagePath: 'pages/queue/index',
        text: '候补'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
