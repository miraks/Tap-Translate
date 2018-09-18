module.exports = {
  presets: [
    [
      '@babel/preset-react',
      { pragma: 'h' }
    ]
  ],
  plugins: [
    '@babel/plugin-syntax-object-rest-spread',
    '@babel/plugin-proposal-class-properties'
  ]
}
