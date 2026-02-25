package response

import (
	"encoding/json"
	"net/http"
)

// dataWrapper wraps a successful response payload.
type dataWrapper struct {
	Data interface{} `json:"data"`
}

// errorWrapper wraps an error response message.
type errorWrapper struct {
	Error string `json:"error"`
}

// validationErrorWrapper wraps a validation error with field issues.
type validationErrorWrapper struct {
	Error  string              `json:"error"`
	Issues []map[string]string `json:"issues,omitempty"`
}

// JSON writes a JSON response with the given status code.
func JSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data) //nolint:errcheck
}

// Success writes a successful JSON response wrapped in { "data": ... }.
func Success(w http.ResponseWriter, data interface{}, status int) {
	JSON(w, dataWrapper{Data: data}, status)
}

// Error writes an error JSON response with { "error": "message" }.
func Error(w http.ResponseWriter, message string, status int) {
	JSON(w, errorWrapper{Error: message}, status)
}

// ValidationError writes a validation error response.
func ValidationError(w http.ResponseWriter, message string, issues []map[string]string) {
	JSON(w, validationErrorWrapper{Error: message, Issues: issues}, http.StatusUnprocessableEntity)
}

// Created writes a 201 response with { "data": ... }.
func Created(w http.ResponseWriter, data interface{}) {
	Success(w, data, http.StatusCreated)
}

// OK writes a 200 response with { "data": ... }.
func OK(w http.ResponseWriter, data interface{}) {
	Success(w, data, http.StatusOK)
}

// NotFound writes a 404 error response.
func NotFound(w http.ResponseWriter, resource string) {
	Error(w, resource+" not found", http.StatusNotFound)
}

// BadRequest writes a 400 error response.
func BadRequest(w http.ResponseWriter, message string) {
	Error(w, message, http.StatusBadRequest)
}

// InternalError writes a 500 error response.
func InternalError(w http.ResponseWriter, message string) {
	Error(w, message, http.StatusInternalServerError)
}

// Message writes a success response with a message field.
func Message(w http.ResponseWriter, message string, status int) {
	Success(w, map[string]string{"message": message}, status)
}
