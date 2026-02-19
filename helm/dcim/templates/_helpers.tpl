{{/*
Expand the name of the chart.
*/}}
{{- define "dcim.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "dcim.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "dcim.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "dcim.labels" -}}
helm.sh/chart: {{ include "dcim.chart" . }}
app.kubernetes.io/name: {{ include "dcim.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
environment: {{ .Values.global.environment }}
{{- end }}

{{/*
Selector labels for the app deployment.
*/}}
{{- define "dcim.app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "dcim.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: app
{{- end }}

{{/*
Selector labels for the postgres StatefulSet.
*/}}
{{- define "dcim.postgres.selectorLabels" -}}
app.kubernetes.io/name: {{ include "dcim.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: postgres
{{- end }}

{{/*
Namespace name — resolves to .Values.namespace.name.
*/}}
{{- define "dcim.namespace" -}}
{{- .Values.namespace.name }}
{{- end }}

{{/*
Full DATABASE_URL built from postgres credentials.
*/}}
{{- define "dcim.databaseUrl" -}}
{{- printf "postgresql://%s:%s@postgres.%s.svc.cluster.local:%d/%s"
    .Values.postgres.credentials.username
    .Values.postgres.credentials.password
    .Values.namespace.name
    (.Values.postgres.service.port | int)
    .Values.postgres.credentials.database }}
{{- end }}
