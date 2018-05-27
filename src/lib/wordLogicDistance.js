module.exports = (word1, word2) => {
  const minWord = (word1.length <= word2.length ? word1 : word2)
  const maxWord = (word1.length > word2.length ? word1 : word2)
  return maxWord.match(minWord) ? minWord.length : 0
}