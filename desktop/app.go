package main

import (
	"context"
	"fmt"
	"runtime"
)

// App struct holds the application state
type App struct {
	ctx context.Context
}

// NewApp creates a new App instance
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called when the app terminates
func (a *App) shutdown(ctx context.Context) {
	// Cleanup resources here
}

// Greet returns a greeting message
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello, %s! Welcome to Wagie HUD.", name)
}

// SystemInfo holds system information
type SystemInfo struct {
	OS       string `json:"os"`
	Arch     string `json:"arch"`
	Hostname string `json:"hostname"`
}

// GetSystemInfo returns system information
func (a *App) GetSystemInfo() SystemInfo {
	return SystemInfo{
		OS:   runtime.GOOS,
		Arch: runtime.GOARCH,
	}
}
