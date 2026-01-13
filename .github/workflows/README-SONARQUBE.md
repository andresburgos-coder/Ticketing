# 🔬 Configuración de SonarQube Cloud

Este documento explica cómo configurar SonarQube Cloud para el análisis de calidad de código en el pipeline de CI/CD.

## 📋 Requisitos Previos

1. **Cuenta en SonarQube Cloud**: Crear cuenta en [sonarcloud.io](https://sonarcloud.io)
2. **Organización**: Crear o seleccionar una organización
3. **Proyecto**: Crear un nuevo proyecto en SonarQube Cloud

## 🔑 Configuración de Secrets en GitHub

Debes agregar los siguientes secrets en tu repositorio de GitHub:

### Pasos para agregar secrets:
1. Ve a tu repositorio en GitHub
2. Click en `Settings` > `Secrets and variables` > `Actions`
3. Click en `New repository secret`
4. Agrega los siguientes secrets:

### Secrets Requeridos:

#### 1. `SONAR_TOKEN`
- **Descripción**: Token de autenticación para SonarQube Cloud
- **Cómo obtenerlo**:
  1. Ve a [SonarCloud](https://sonarcloud.io)
  2. Click en tu avatar > My Account
  3. Security tab
  4. Generate Token
  5. Copia el token generado

#### 2. `SONAR_ORGANIZATION`
- **Descripción**: Key de tu organización en SonarQube Cloud
- **Ejemplo**: `tu-organizacion`
- **Cómo obtenerlo**:
  1. Ve a tu organización en SonarCloud
  2. Copia el Organization Key

#### 3. `SONAR_PROJECT_KEY`
- **Descripción**: Key única del proyecto
- **Formato sugerido**: `organizacion_ticketing-system`
- **Cómo obtenerlo**:
  1. Al crear el proyecto en SonarCloud, se genera automáticamente
  2. También lo puedes ver en Project Settings

## 🛠️ Configuración del Proyecto en SonarQube Cloud

### 1. Crear Proyecto Manual

```bash
# En SonarCloud:
1. Click en "+" (Analyze new project)
2. Selecciona "Create project manually"
3. Nombre del proyecto: "Ticketing System"
4. Project key: tu-organizacion_ticketing-system
5. Selecciona "Public" o "Private"
```

### 2. Configurar Análisis con GitHub Actions

```bash
# SonarCloud te ofrecerá opciones de integración:
1. Selecciona "With GitHub Actions"
2. Sigue las instrucciones para agregar los secrets
3. El archivo ci-pipeline.yml ya está configurado
```

## 📊 Quality Gates

El pipeline incluye verificación del Quality Gate de SonarQube. Los criterios por defecto incluyen:

- **Coverage**: Mínimo 80% de cobertura de código
- **Duplications**: Máximo 3% de código duplicado
- **Maintainability Rating**: A o B
- **Reliability Rating**: A o B
- **Security Rating**: A o B
- **Security Hotspots**: 100% revisados

### Personalizar Quality Gate:

1. Ve a tu proyecto en SonarCloud
2. Project Settings > Quality Gate
3. Selecciona o crea un Quality Gate personalizado

## 🔍 Análisis Local (Opcional)

Para analizar el código localmente antes de hacer push:

### Instalar SonarScanner:

```bash
# macOS
brew install sonar-scanner

# Windows (con Chocolatey)
choco install sonarscanner

# Linux
# Descargar desde https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
```

### Ejecutar análisis local:

```bash
# En la raíz del proyecto
sonar-scanner \
  -Dsonar.organization=TU_ORGANIZACION \
  -Dsonar.projectKey=TU_PROJECT_KEY \
  -Dsonar.sources=. \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=TU_TOKEN
```

## 📈 Métricas Analizadas

### Backend (NestJS):
- Complejidad ciclomática
- Cobertura de tests
- Code smells
- Bugs potenciales
- Vulnerabilidades de seguridad
- Código duplicado

### Frontend (Angular):
- Complejidad de componentes
- Cobertura de tests
- Best practices de Angular
- Accesibilidad (A11y)
- Seguridad XSS

## 🚦 Interpretación de Resultados

### Ratings:
- **A**: Excelente (0-5% problemas)
- **B**: Bueno (5-10% problemas)
- **C**: Aceptable (10-20% problemas)
- **D**: Pobre (20-50% problemas)
- **E**: Crítico (>50% problemas)

### Estados del Quality Gate:
- ✅ **Passed**: Código cumple todos los criterios
- ❌ **Failed**: Código no cumple algún criterio
- ⏳ **Pending**: Análisis en progreso

## 🔧 Troubleshooting

### Error: "SONAR_TOKEN not found"
```bash
# Verifica que el secret esté configurado en GitHub
# Settings > Secrets > Actions > SONAR_TOKEN
```

### Error: "Quality Gate timeout"
```bash
# El análisis está tomando más de 5 minutos
# Aumenta el timeout en el workflow:
timeout-minutes: 10
```

### Coverage no se muestra
```bash
# Verifica que los archivos lcov.info existan:
- backend/coverage/lcov.info
- frontend/coverage/lcov.info

# Ejecuta los tests con coverage antes del análisis
```

## 📚 Recursos Adicionales

- [SonarQube Cloud Docs](https://docs.sonarqube.org/latest/)
- [GitHub Actions Integration](https://github.com/SonarSource/sonarqube-scan-action)
- [Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)
- [TypeScript/JavaScript Rules](https://rules.sonarsource.com/typescript)

## 🎯 Próximos Pasos

1. ✅ Configurar secrets en GitHub
2. ✅ Crear proyecto en SonarQube Cloud
3. ✅ Hacer push al repositorio
4. ✅ Verificar el análisis en la pestaña Actions
5. ✅ Revisar resultados en SonarCloud
6. ✅ Ajustar Quality Gate según necesidades del proyecto

---

**Nota**: El análisis de SonarQube Cloud es **continue-on-error**, lo que significa que no bloqueará el pipeline inicialmente. Una vez estés conforme con la configuración, puedes cambiar esto a `false` para que falle si no se cumplen los criterios de calidad.
