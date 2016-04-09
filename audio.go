package main

import (
	"os/exec"
	"path/filepath"
)

func genAudio(path, emoji string) error {
	cmd := exec.Command("say", "-v", "Xander", "-o", path, emoji)
	if err := cmd.Run(); err != nil {
		return err
	}
	return nil
}

func getAudio(id, emoji string) (path string, err error) {
	path = filepath.Join("audio", id+".aac")
	exists, err := fileExists(path)
	if err != nil {
		return "", err
	}

	if !exists {
		if err = genAudio(path, emoji); err != nil {
			return "", err
		}
	}
	return path, nil
}
