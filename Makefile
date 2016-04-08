BIN := welke-emoji
SOURCE := $(wildcard *.go)

.PHONY: all clean remake

$(BIN): $(SOURCE)
	go build -o $@

all: $(BIN)

clean:
	rm -f $(BIN)

remake: clean all
