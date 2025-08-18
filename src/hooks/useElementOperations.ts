import { useCallback } from 'react';
import { SelectedElement, ViewMode } from '../types';

interface UseElementOperationsProps {
  parsedData: any;
  selectedElement: SelectedElement | null;
  setSelectedElement: (element: SelectedElement | null) => void;
  setViewMode: (mode: ViewMode) => void;
  updateParsedData: (newData: any, setWebpipeSource: (source: string) => void) => void;
  setWebpipeSource: (source: string) => void;
}

export const useElementOperations = ({
  parsedData,
  selectedElement,
  setSelectedElement,
  setViewMode,
  updateParsedData,
  setWebpipeSource
}: UseElementOperationsProps) => {

  const createNewRoute = useCallback(() => {
    let counter = 1;
    let newPath = '/new-route';
    
    if (parsedData && parsedData.routes) {
      while (parsedData.routes.some((route: any) => route.path === newPath)) {
        counter++;
        newPath = `/new-route-${counter}`;
      }
    }
    
    const newRoute = {
      method: 'GET',
      path: newPath,
      pipeline: {
        kind: 'Inline',
        pipeline: {
          steps: [
            {
              kind: 'Regular',
              name: 'jq',
              config: '{ message: "Hello from new route" }'
            }
          ]
        }
      }
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        routes: [...(parsedData.routes || []), newRoute]
      };
      updateParsedData(updatedData, setWebpipeSource);
    }
  }, [parsedData, updateParsedData, setWebpipeSource]);

  const createNewTest = useCallback(() => {
    const newTest = {
      name: 'new test',
      mocks: [],
      tests: [
        {
          name: 'should work',
          mocks: [],
          when: {
            kind: 'CallingRoute',
            method: 'GET',
            path: '/new-route'
          },
          input: null,
          conditions: [
            {
              field: 'status',
              comparison: 'equals',
              value: '200',
              conditionType: 'then'
            }
          ]
        }
      ]
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        describes: [...(parsedData.describes || []), newTest]
      };
      updateParsedData(updatedData, setWebpipeSource);
    }
  }, [parsedData, updateParsedData, setWebpipeSource]);

  const createNewVariable = useCallback(() => {
    const newVariable = {
      varType: 'jq',
      name: 'newVariable',
      value: '{ message: "Hello from variable" }'
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        variables: [...(parsedData.variables || []), newVariable]
      };
      updateParsedData(updatedData, setWebpipeSource);
    }
  }, [parsedData, updateParsedData, setWebpipeSource]);

  const createNewPipeline = useCallback(() => {
    const newPipeline = {
      name: 'newPipeline',
      pipeline: {
        steps: [
          {
            kind: 'Regular',
            name: 'jq',
            config: '{ message: "Hello from pipeline" }'
          }
        ]
      }
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        pipelines: [...(parsedData.pipelines || []), newPipeline]
      };
      updateParsedData(updatedData, setWebpipeSource);
    }
  }, [parsedData, updateParsedData, setWebpipeSource]);

  const createNewConfig = useCallback(() => {
    const newConfig = {
      name: 'newConfig',
      properties: [
        {
          key: 'enabled',
          value: {
            kind: 'Boolean',
            value: true
          }
        }
      ]
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        configs: [...(parsedData.configs || []), newConfig]
      };
      updateParsedData(updatedData, setWebpipeSource);
    }
  }, [parsedData, updateParsedData, setWebpipeSource]);

  const updateElementName = useCallback((newName: string) => {
    if (!selectedElement || !parsedData) return;

    let updatedData = { ...parsedData };
    let updatedSelectedElement = { ...selectedElement };

    switch (selectedElement.type) {
      case 'route':
        const routeParts = newName.split(' ');
        if (routeParts.length >= 2) {
          const method = routeParts[0];
          const path = routeParts.slice(1).join(' ');
          updatedData.routes = parsedData.routes.map((route: any) => {
            if (route.method === selectedElement.data.method && route.path === selectedElement.data.path) {
              const updatedRoute = { ...route, method, path };
              updatedSelectedElement.data = updatedRoute;
              return updatedRoute;
            }
            return route;
          });
        }
        break;
        
      case 'test':
        updatedData.describes = parsedData.describes.map((test: any) => {
          if (test.name === selectedElement.data.name) {
            const updatedTest = { ...test, name: newName };
            updatedSelectedElement.data = updatedTest;
            return updatedTest;
          }
          return test;
        });
        break;
        
      case 'variable':
        updatedData.variables = parsedData.variables.map((variable: any) => {
          if (variable.name === selectedElement.data.name) {
            const updatedVariable = { ...variable, name: newName };
            updatedSelectedElement.data = updatedVariable;
            return updatedVariable;
          }
          return variable;
        });
        break;
        
      case 'pipeline':
        updatedData.pipelines = parsedData.pipelines.map((pipeline: any) => {
          if (pipeline.name === selectedElement.data.name) {
            const updatedPipeline = { ...pipeline, name: newName };
            updatedSelectedElement.data = updatedPipeline;
            return updatedPipeline;
          }
          return pipeline;
        });
        break;
        
      case 'config':
        updatedData.configs = parsedData.configs.map((config: any) => {
          if (config.name === selectedElement.data.name) {
            const updatedConfig = { ...config, name: newName };
            updatedSelectedElement.data = updatedConfig;
            return updatedConfig;
          }
          return config;
        });
        break;
    }

    updateParsedData(updatedData, setWebpipeSource);
    setSelectedElement(updatedSelectedElement);
  }, [selectedElement, parsedData, updateParsedData, setWebpipeSource, setSelectedElement]);

  const updateElementValue = useCallback((newValue: string) => {
    if (!selectedElement || !parsedData) return;

    let updatedData = { ...parsedData };
    let updatedSelectedElement = { ...selectedElement };

    switch (selectedElement.type) {
      case 'variable':
        updatedData.variables = parsedData.variables.map((variable: any) => {
          if (variable.name === selectedElement.data.name) {
            const updatedVariable = { ...variable, value: newValue };
            updatedSelectedElement.data = updatedVariable;
            return updatedVariable;
          }
          return variable;
        });
        break;
        
      case 'config':
        updatedData.configs = parsedData.configs.map((config: any) => {
          if (config.name === selectedElement.data.name) {
            const updatedConfig = { ...config, value: newValue };
            updatedSelectedElement.data = updatedConfig;
            return updatedConfig;
          }
          return config;
        });
        break;
        
      default:
        return;
    }

    updateParsedData(updatedData, setWebpipeSource);
    setSelectedElement(updatedSelectedElement);
  }, [selectedElement, parsedData, updateParsedData, setWebpipeSource, setSelectedElement]);

  const deleteElement = useCallback(() => {
    if (!selectedElement || !parsedData) return;

    let updatedData = { ...parsedData };

    switch (selectedElement.type) {
      case 'route':
        updatedData.routes = parsedData.routes.filter((route: any) => 
          !(route.method === selectedElement.data.method && route.path === selectedElement.data.path)
        );
        break;
        
      case 'test':
        updatedData.describes = parsedData.describes.filter((test: any) => 
          test.name !== selectedElement.data.name
        );
        break;
        
      case 'variable':
        updatedData.variables = parsedData.variables.filter((variable: any) => 
          variable.name !== selectedElement.data.name
        );
        break;
        
      case 'pipeline':
        updatedData.pipelines = parsedData.pipelines.filter((pipeline: any) => 
          pipeline.name !== selectedElement.data.name
        );
        break;
        
      case 'config':
        updatedData.configs = parsedData.configs.filter((config: any) => 
          config.name !== selectedElement.data.name
        );
        break;
    }

    updateParsedData(updatedData, setWebpipeSource);
    setSelectedElement(null);
    setViewMode('source');
  }, [selectedElement, parsedData, updateParsedData, setWebpipeSource, setSelectedElement, setViewMode]);

  const deleteSpecificElement = useCallback((elementType: string, elementData: any) => {
    if (!parsedData) return;

    let updatedData = { ...parsedData };

    switch (elementType) {
      case 'route':
        updatedData.routes = parsedData.routes.filter((route: any) => 
          !(route.method === elementData.method && route.path === elementData.path)
        );
        break;
        
      case 'test':
        updatedData.describes = parsedData.describes.filter((test: any) => 
          test.name !== elementData.name
        );
        break;
        
      case 'variable':
        updatedData.variables = parsedData.variables.filter((variable: any) => 
          variable.name !== elementData.name
        );
        break;
        
      case 'pipeline':
        updatedData.pipelines = parsedData.pipelines.filter((pipeline: any) => 
          pipeline.name !== elementData.name
        );
        break;
        
      case 'config':
        updatedData.configs = parsedData.configs.filter((config: any) => 
          config.name !== elementData.name
        );
        break;
    }

    if (selectedElement && 
        selectedElement.type === elementType && 
        ((elementType === 'route' && selectedElement.data.method === elementData.method && selectedElement.data.path === elementData.path) ||
         (elementType !== 'route' && selectedElement.data.name === elementData.name))) {
      setSelectedElement(null);
      setViewMode('source');
    }

    updateParsedData(updatedData, setWebpipeSource);
  }, [parsedData, selectedElement, updateParsedData, setWebpipeSource, setSelectedElement, setViewMode]);

  return {
    createNewRoute,
    createNewTest,
    createNewVariable,
    createNewPipeline,
    createNewConfig,
    updateElementName,
    updateElementValue,
    deleteElement,
    deleteSpecificElement
  };
};