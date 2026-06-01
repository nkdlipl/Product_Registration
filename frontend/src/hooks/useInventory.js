import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPCBs, createPCB, updatePCB, deletePCB, deletePCBImage, deletePCBFile,
  getElectronicsParts, createElectronicsPart, updateElectronicsPart, deleteElectronicsPart, deleteElectronicsImage, deleteElectronicsFile,
  getElectricalParts, createElectricalPart, updateElectricalPart, deleteElectricalPart, deleteElectricalImage, deleteElectricalFile,
  getStructuralParts, createStructuralPart, updateStructuralPart, deleteStructuralPart, deleteStructuralImage, deleteStructuralFile
} from '../api/inventory';
import { getAdminStats } from '../api/admin';

// --- PCBs ---
export const usePCBs = (params) => {
  return useQuery({
    queryKey: ['pcbs', params],
    queryFn: async () => {
      const response = await getPCBs(params);
      return response.data;
    },
    keepPreviousData: true,
  });
};

export const useCreatePCB = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPCB,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pcbs'] }),
  });
};

export const useUpdatePCB = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatePCB(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pcbs'] }),
  });
};

export const useDeletePCB = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePCB,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pcbs'] }),
  });
};

// --- Electronics ---
export const useElectronicsParts = (params) => {
  return useQuery({
    queryKey: ['electronicsParts', params],
    queryFn: async () => {
      const response = await getElectronicsParts(params);
      return response.data;
    },
    keepPreviousData: true,
  });
};

export const useCreateElectronicsPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createElectronicsPart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['electronicsParts'] }),
  });
};

export const useUpdateElectronicsPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateElectronicsPart(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['electronicsParts'] }),
  });
};

export const useDeleteElectronicsPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteElectronicsPart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['electronicsParts'] }),
  });
};

// --- Electrical ---
export const useElectricalParts = (params) => {
  return useQuery({
    queryKey: ['electricalParts', params],
    queryFn: async () => {
      const response = await getElectricalParts(params);
      return response.data;
    },
    keepPreviousData: true,
  });
};

export const useCreateElectricalPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createElectricalPart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['electricalParts'] }),
  });
};

export const useUpdateElectricalPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateElectricalPart(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['electricalParts'] }),
  });
};

export const useDeleteElectricalPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteElectricalPart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['electricalParts'] }),
  });
};

// --- Structural ---
export const useStructuralParts = (params) => {
  return useQuery({
    queryKey: ['structuralParts', params],
    queryFn: async () => {
      const response = await getStructuralParts(params);
      return response.data;
    },
    keepPreviousData: true,
  });
};

export const useCreateStructuralPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStructuralPart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['structuralParts'] }),
  });
};

export const useUpdateStructuralPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateStructuralPart(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['structuralParts'] }),
  });
};

export const useDeleteStructuralPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStructuralPart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['structuralParts'] }),
  });
};

// --- Aggregate Hooks ---
export const useInventoryStats = () => {
  return useQuery({
    queryKey: ['inventoryStats'],
    queryFn: async () => {
      const res = await getAdminStats();
      return res.data?.data?.inventory || { pcb: 0, electronics: 0, electrical: 0, structural: 0 };
    },
    keepPreviousData: true,
  });
};

export const useInventoryOverview = ({ type, selectedCategory, searchTerm, pagination }) => {
  return useQuery({
    queryKey: ['inventory', { type, selectedCategory, searchTerm, page: pagination.page, limit: pagination.limit }],
    queryFn: async () => {
      let allItems = [];
      let totalCount = 0;

      if (!type) {
        if (selectedCategory) {
            let res;
            if (selectedCategory === 'PCB') {
                res = await getPCBs({ limit: pagination.limit, search: searchTerm });
                allItems = (res.data.data || []).map(i => ({ ...i, category: 'PCB', pcb_name: i.pcb_name, pcb_id: i.pcb_id }));
            } else if (selectedCategory === 'Electronic Part') {
                res = await getElectronicsParts({ limit: pagination.limit, search: searchTerm });
                allItems = (res.data.data || []).map(i => ({ ...i, category: 'Electronic Part', pcb_name: i.part_name, pcb_id: i.part_id }));
            } else if (selectedCategory === 'Electrical Part') {
                res = await getElectricalParts({ limit: pagination.limit, search: searchTerm });
                allItems = (res.data.data || []).map(i => ({ ...i, category: 'Electrical Part', pcb_name: i.part_name, pcb_id: i.part_id }));
            } else if (selectedCategory === 'Structural Part') {
                res = await getStructuralParts({ limit: pagination.limit, search: searchTerm });
                allItems = (res.data.data || []).map(i => ({ ...i, category: 'Structural Part', pcb_name: i.part_name, pcb_id: i.part_id }));
            }
            totalCount = res?.data?.meta?.total || allItems.length;
        } else {
            const [pcbRes, elecRes, electRes, structRes] = await Promise.all([
              getPCBs({ limit: 15, search: searchTerm }),
              getElectronicsParts({ limit: 15, search: searchTerm }),
              getElectricalParts({ limit: 15, search: searchTerm }),
              getStructuralParts({ limit: 15, search: searchTerm })
            ]);
            
            let pcbs = (pcbRes.data.data || []).map(i => ({ ...i, category: 'PCB', pcb_name: i.pcb_name, pcb_id: i.pcb_id }));
            let electronics = (elecRes.data.data || []).map(i => ({ ...i, category: 'Electronic Part', pcb_name: i.part_name, pcb_id: i.part_id }));
            let electrical = (electRes.data.data || []).map(i => ({ ...i, category: 'Electrical Part', pcb_name: i.part_name, pcb_id: i.part_id }));
            let structural = (structRes.data.data || []).map(i => ({ ...i, category: 'Structural Part', pcb_name: i.part_name, pcb_id: i.part_id }));
            
            allItems = [...pcbs, ...electronics, ...electrical, ...structural];
            totalCount = allItems.length;
        }
      } else if (type === 'PCB') {
        const res = await getPCBs({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm
        });
        allItems = (res.data.data || []).map(i => ({ ...i, category: 'PCB' }));
        totalCount = res.data.meta.total;
      } else if (type === 'Electronic Part') {
        const res = await getElectronicsParts({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm
        });
        allItems = (res.data.data || []).map(i => ({ ...i, category: 'Electronic Part', pcb_name: i.part_name, pcb_id: i.part_id }));
        totalCount = res.data.meta.total;
      } else if (type === 'Electrical Part') {
        const res = await getElectricalParts({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm
        });
        allItems = (res.data.data || []).map(i => ({ ...i, category: 'Electrical Part', pcb_name: i.part_name, pcb_id: i.part_id }));
        totalCount = res.data.meta.total;
      } else if (type === 'Structural Part') {
        const res = await getStructuralParts({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm
        });
        allItems = (res.data.data || []).map(i => ({ ...i, category: 'Structural Part', pcb_name: i.part_name, pcb_id: i.part_id }));
        totalCount = res.data.meta.total;
      }

      return { data: allItems, total: totalCount };
    },
    keepPreviousData: true,
  });
};
