"use client";

import ReactQuill from "react-quill-new";
import { FieldErrorText } from "rizzui";
import cn from "../utils/class-names";
import "react-quill-new/dist/quill.snow.css";

interface QuillEditorProps extends ReactQuill.ReactQuillProps {
  error?: string;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  toolbarPosition?: "top" | "bottom";
}

export default function QuillEditor({
  id,
  label,
  error,
  className,
  labelClassName,
  errorClassName,
  toolbarPosition = "top",
  ...props
}: QuillEditorProps) {
  const quillModules = {
    toolbar: [

      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],

      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],

      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],

      ["clean"],
    ],
  };


  return (
    <div className={cn(className)}>
      {label && (
        <label className={cn("mb-1.5 block", labelClassName)}>{label}</label>
      )}
      <ReactQuill
        theme="snow"
        modules={quillModules}
        className={cn(
          "react-quill",
          toolbarPosition === "bottom" && "react-quill-toolbar-bottom relative",
          className
        )}
        {...props}
      />
      {error && (
        <FieldErrorText size="md" error={error} className={errorClassName} />
      )}
    </div>
  );
}
