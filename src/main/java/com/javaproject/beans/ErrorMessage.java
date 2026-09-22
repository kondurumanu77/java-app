package com.javaproject.beans;

public class ErrorMessage {
    private final String STATUS = "error";

    private String message;

    public ErrorMessage(String message) {
        this.message = message;
    }

    public String getSTATUS() {
        return STATUS;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
