package main

import (
	"math/rand"

	"gopkg.in/kyokomi/emoji.v1"
)

func randomEmoji() string {
	pairs := emoji.CodeMap()
	index := rand.Intn(len(pairs))

	i := 0
	for _, val := range pairs {
		if i == index {
			return val
		}
		i++
	}

	panic("unreachable")
}

func isEmoji(s string) bool {
	pairs := emoji.CodeMap()
	for _, val := range pairs {
		if val == s {
			return true
		}
	}
	return false
}
